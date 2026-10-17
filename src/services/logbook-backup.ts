import { createBackup, parseBackup } from "../domain/backup";
import {
  decryptBackup,
  encryptBackup,
  isEncryptedBackupFile,
  type EncryptedBackupPayload,
} from "../domain/encrypted-backup";
import type { Pathway } from "../domain/logbook";
import {
  getCases,
  getPathwayModes,
  restoreBackup,
} from "../storage/logbook-store";

export const MAX_BACKUP_SIZE = 10 * 1024 * 1024;
export const MAX_BACKUP_FILE_SIZE = 15 * 1024 * 1024;

function serializedSize(serialized: string) {
  return new TextEncoder().encode(serialized).byteLength;
}

function resolvePathwayModes(
  storedModes: Partial<Record<Pathway, boolean>>,
  currentModes: Record<Pathway, boolean>,
) {
  return {
    lung: storedModes.lung ?? currentModes.lung,
    heart: storedModes.heart ?? currentModes.heart,
    abdomen: storedModes.abdomen ?? currentModes.abdomen,
    dvt: storedModes.dvt ?? currentModes.dvt,
    hd: storedModes.hd ?? currentModes.hd,
    vascular: storedModes.vascular ?? currentModes.vascular,
  };
}

export async function createEncryptedLogbookBackup(
  currentModes: Record<Pathway, boolean>,
  passphrase: string,
) {
  const [cases, storedModes] = await Promise.all([getCases(), getPathwayModes()]);
  const backup = createBackup(cases, resolvePathwayModes(storedModes, currentModes));
  const serialized = JSON.stringify(backup);
  if (serializedSize(serialized) > MAX_BACKUP_SIZE) {
    throw new Error("Backup data is larger than the supported 10 MB limit.");
  }

  return {
    payload: await encryptBackup(serialized, passphrase),
    caseCount: cases.length,
    exportedAt: backup.exportedAt,
  };
}

async function restoreSerializedBackup(serialized: string) {
  if (serializedSize(serialized) > MAX_BACKUP_SIZE) {
    throw new Error("Decrypted backup files must be 10 MB or smaller.");
  }
  return restoreBackup(parseBackup(serialized));
}

export async function restoreEncryptedLogbookBackup(
  payload: EncryptedBackupPayload,
  passphrase: string,
) {
  return restoreSerializedBackup(await decryptBackup(payload, passphrase));
}

export async function restoreBackupFile(
  serialized: string,
  passphrase: string,
) {
  if (serializedSize(serialized) > MAX_BACKUP_FILE_SIZE) {
    throw new Error("Backup files must be 15 MB or smaller.");
  }
  if (isEncryptedBackupFile(serialized)) {
    return restoreEncryptedLogbookBackup(serialized, passphrase);
  }
  return restoreSerializedBackup(serialized);
}
