import { isEncryptedBackupFile, type EncryptedBackupPayload } from "../domain/encrypted-backup";
import type { EncryptedBackupProvider } from "./backup-provider";

const GOOGLE_IDENTITY_SCRIPT = "https://accounts.google.com/gsi/client";
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const BACKUP_MIME_TYPE = "application/vnd.pocus-logbook.encrypted-backup+json";
const BACKUP_NAME_PREFIX = "pocus-logbook-backup-";

interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface GoogleTokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (options: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: { type?: string; message?: string }) => void;
          }) => GoogleTokenClient;
        };
      };
    };
  }
}

let identityScriptPromise: Promise<void> | null = null;
let accessToken: string | null = null;
let accessTokenExpiresAt = 0;

export function googleDriveClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "";
}

export function loadGoogleIdentityServices() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (identityScriptPromise) return identityScriptPromise;

  identityScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_IDENTITY_SCRIPT}"]`,
    );
    const script = existingScript ?? document.createElement("script");
    const onLoad = () => window.google?.accounts?.oauth2
      ? resolve()
      : reject(new Error("Google sign-in could not be initialized."));
    const onError = () => reject(new Error("Google sign-in could not be loaded. Check your connection and try again."));

    if (window.google?.accounts?.oauth2) {
      resolve();
    } else {
      script.addEventListener("load", onLoad, { once: true });
      script.addEventListener("error", onError, { once: true });
      if (!existingScript) {
        script.src = GOOGLE_IDENTITY_SCRIPT;
        script.async = true;
        script.defer = true;
        document.head.append(script);
      }
    }
  }).catch((cause: unknown) => {
    identityScriptPromise = null;
    throw cause;
  });

  return identityScriptPromise;
}

export function requestGoogleDriveAccess(clientId: string) {
  if (accessToken && Date.now() < accessTokenExpiresAt - 60_000) {
    return Promise.resolve(accessToken);
  }
  const tokenClientFactory = window.google?.accounts?.oauth2?.initTokenClient;
  if (!tokenClientFactory) {
    return Promise.reject(new Error("Google sign-in is still loading. Try again in a moment."));
  }

  return new Promise<string>((resolve, reject) => {
    const client = tokenClientFactory({
      client_id: clientId,
      scope: GOOGLE_DRIVE_SCOPE,
      callback: (response) => {
        if (!response.access_token) {
          reject(new Error(response.error_description || response.error || "Google Drive access was not granted."));
          return;
        }
        accessToken = response.access_token;
        accessTokenExpiresAt = Date.now() + (response.expires_in ?? 3600) * 1000;
        resolve(response.access_token);
      },
      error_callback: (error) => reject(new Error(error.message || "Google sign-in was closed or could not be completed.")),
    });
    client.requestAccessToken({ prompt: "" });
  });
}

interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
}

async function driveRequest<T>(token: string, url: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  if (!response.ok) {
    if (response.status === 401) {
      accessToken = null;
      accessTokenExpiresAt = 0;
    }
    const detail = await response.text();
    let message = `Google Drive request failed (${response.status}).`;
    try {
      const parsed = JSON.parse(detail) as { error?: { message?: string } };
      message = parsed.error?.message || message;
    } catch {
      // Keep the safe generic message when Drive returns a non-JSON error page.
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

async function listBackups(token: string) {
  const params = new URLSearchParams({
    spaces: "appDataFolder",
    q: `name contains '${BACKUP_NAME_PREFIX}' and trashed = false`,
    orderBy: "modifiedTime desc",
    pageSize: "100",
    fields: "files(id,name,modifiedTime)",
  });
  const result = await driveRequest<{ files?: DriveFile[] }>(
    token,
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
  );
  return result.files ?? [];
}

export async function uploadEncryptedBackupToDrive(token: string, encrypted: EncryptedBackupPayload) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const metadata = {
    name: `${BACKUP_NAME_PREFIX}${timestamp}.pocusbackup`,
    mimeType: BACKUP_MIME_TYPE,
    parents: ["appDataFolder"],
  };
  const boundary = `pocus-logbook-${crypto.randomUUID()}`;
  const body = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`,
    `--${boundary}\r\nContent-Type: ${BACKUP_MIME_TYPE}\r\n\r\n${encrypted}`,
    `--${boundary}--`,
  ].join("\r\n");
  const result = await driveRequest<{ id: string; name: string; modifiedTime: string }>(
    token,
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime",
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    },
  );
  return result;
}

export async function downloadLatestBackupFromDrive(token: string) {
  const backups = await listBackups(token);
  const latest = backups[0];
  if (!latest) throw new Error("No CritSono: POCUS Logbook backups were found in this Google Drive app folder.");

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(latest.id)}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    if (response.status === 401) {
      accessToken = null;
      accessTokenExpiresAt = 0;
    }
    throw new Error(response.status === 404
      ? "The latest Google Drive backup is no longer available."
      : `Google Drive backup download failed (${response.status}).`);
  }
  const encrypted = await response.text();
  if (new TextEncoder().encode(encrypted).byteLength > 15 * 1024 * 1024) {
    throw new Error("Backup files must be 15 MB or smaller.");
  }
  return { encrypted, file: latest };
}

export const googleDriveBackupProvider: EncryptedBackupProvider<string> = {
  async upload(token, payload) {
    const uploaded = await uploadEncryptedBackupToDrive(token, payload);
    return { modifiedAt: uploaded.modifiedTime };
  },
  async downloadLatest(token) {
    const downloaded = await downloadLatestBackupFromDrive(token);
    if (!isEncryptedBackupFile(downloaded.encrypted)) {
      throw new Error("The latest Google Drive file is not an encrypted CritSono: POCUS Logbook backup.");
    }
    return {
      payload: downloaded.encrypted,
      name: downloaded.file.name,
      modifiedAt: downloaded.file.modifiedTime,
    };
  },
};
