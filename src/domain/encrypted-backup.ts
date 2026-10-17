const ENCRYPTED_BACKUP_APP_ID = "pocus-logbook-encrypted-backup";
const ENCRYPTED_BACKUP_VERSION = 1;
const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const MIN_PASSPHRASE_LENGTH = 14;
const MAX_ENCRYPTED_FILE_SIZE = 15 * 1024 * 1024;

declare const encryptedBackupPayloadBrand: unique symbol;
export type EncryptedBackupPayload = string & {
  readonly [encryptedBackupPayloadBrand]: true;
};

interface EncryptedBackupEnvelope {
  app: typeof ENCRYPTED_BACKUP_APP_ID;
  formatVersion: typeof ENCRYPTED_BACKUP_VERSION;
  kdf: "PBKDF2-HMAC-SHA-256";
  iterations: typeof PBKDF2_ITERATIONS;
  cipher: "AES-256-GCM";
  salt: string;
  iv: string;
  ciphertext: string;
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function decodeBase64(value: string): Uint8Array {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new Error("This encrypted backup has an invalid format.");
  }
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer as ArrayBuffer;
}

function envelopeAad(envelope: Pick<EncryptedBackupEnvelope,
  "app" | "formatVersion" | "kdf" | "iterations" | "cipher" | "salt">) {
  return new TextEncoder().encode(JSON.stringify(envelope));
}

function validatePassphrase(passphrase: string) {
  if (passphrase.trim().length < MIN_PASSPHRASE_LENGTH) {
    throw new Error(`Use a passphrase at least ${MIN_PASSPHRASE_LENGTH} characters long.`);
  }
  if (new TextEncoder().encode(passphrase).byteLength > 1024) {
    throw new Error("The passphrase is too long.");
  }
}

async function deriveKey(passphrase: string, salt: Uint8Array) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Secure encryption is unavailable in this browser. Open the app over HTTPS or use a supported browser.");
  }
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: toArrayBuffer(salt), iterations: PBKDF2_ITERATIONS },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptBackup(serializedBackup: string, passphrase: string): Promise<EncryptedBackupPayload> {
  validatePassphrase(passphrase);
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
    throw new Error("Secure encryption is unavailable in this browser. Open the app over HTTPS or use a supported browser.");
  }
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const envelope: EncryptedBackupEnvelope = {
    app: ENCRYPTED_BACKUP_APP_ID,
    formatVersion: ENCRYPTED_BACKUP_VERSION,
    kdf: "PBKDF2-HMAC-SHA-256",
    iterations: PBKDF2_ITERATIONS,
    cipher: "AES-256-GCM",
    salt: encodeBase64(salt),
    iv: encodeBase64(iv),
    ciphertext: "",
  };
  const aad = envelopeAad({
    app: envelope.app,
    formatVersion: envelope.formatVersion,
    kdf: envelope.kdf,
    iterations: envelope.iterations,
    cipher: envelope.cipher,
    salt: envelope.salt,
  });
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv), additionalData: toArrayBuffer(aad), tagLength: 128 },
    key,
    new TextEncoder().encode(serializedBackup),
  );
  envelope.ciphertext = encodeBase64(new Uint8Array(ciphertext));
  return JSON.stringify(envelope, null, 2) as EncryptedBackupPayload;
}

export function isEncryptedBackupFile(serialized: string): serialized is EncryptedBackupPayload {
  try {
    const value: unknown = JSON.parse(serialized);
    return Boolean(
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      "app" in value &&
      value.app === ENCRYPTED_BACKUP_APP_ID,
    );
  } catch {
    return false;
  }
}

export async function decryptBackup(serializedEnvelope: string, passphrase: string): Promise<string> {
  validatePassphrase(passphrase);
  if (new TextEncoder().encode(serializedEnvelope).byteLength > MAX_ENCRYPTED_FILE_SIZE) {
    throw new Error("Encrypted backup files must be 15 MB or smaller.");
  }

  let value: unknown;
  try {
    value = JSON.parse(serializedEnvelope);
  } catch {
    throw new Error("This is not a valid encrypted CritSono: POCUS Logbook backup.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("This is not a valid encrypted CritSono: POCUS Logbook backup.");
  }
  const envelope = value as Partial<EncryptedBackupEnvelope>;
  if (
    envelope.app !== ENCRYPTED_BACKUP_APP_ID ||
    envelope.formatVersion !== ENCRYPTED_BACKUP_VERSION ||
    envelope.kdf !== "PBKDF2-HMAC-SHA-256" ||
    envelope.iterations !== PBKDF2_ITERATIONS ||
    envelope.cipher !== "AES-256-GCM" ||
    typeof envelope.salt !== "string" ||
    typeof envelope.iv !== "string" ||
    typeof envelope.ciphertext !== "string"
  ) {
    throw new Error("This encrypted backup version or format is not supported.");
  }

  const salt = decodeBase64(envelope.salt);
  const iv = decodeBase64(envelope.iv);
  const ciphertext = decodeBase64(envelope.ciphertext);
  if (salt.length !== SALT_BYTES || iv.length !== IV_BYTES || ciphertext.length < 16) {
    throw new Error("This encrypted backup has an invalid format.");
  }
  const aad = envelopeAad({
    app: envelope.app,
    formatVersion: envelope.formatVersion,
    kdf: envelope.kdf,
    iterations: envelope.iterations,
    cipher: envelope.cipher,
    salt: envelope.salt,
  });
  try {
    const key = await deriveKey(passphrase, salt);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: toArrayBuffer(iv), additionalData: toArrayBuffer(aad), tagLength: 128 },
      key,
      toArrayBuffer(ciphertext),
    );
    return new TextDecoder("utf-8", { fatal: true }).decode(plaintext);
  } catch (cause) {
    if (cause instanceof Error && cause.message.startsWith("Secure encryption")) throw cause;
    throw new Error("Could not decrypt this backup. Check the passphrase and file integrity.");
  }
}
