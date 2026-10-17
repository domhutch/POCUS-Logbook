import { useState, type ChangeEvent } from "react";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { createBackup, parseBackup } from "../domain/backup";
import {
  googleDriveBackupProvider,
  requestGoogleDriveAccess,
} from "../cloud/google-drive";
import { csvFilename, createCasesCsv } from "../domain/case-csv";
import type { LogbookCase, Pathway } from "../domain/logbook";
import {
  createEncryptedLogbookBackup,
  MAX_BACKUP_FILE_SIZE,
  MAX_BACKUP_SIZE,
  restoreBackupFile,
  restoreEncryptedLogbookBackup,
} from "../services/logbook-backup";

function messageFrom(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}

function toBase64(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The export file could not be read for sharing."));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("The export file could not be prepared for sharing."));
        return;
      }
      resolve(reader.result.slice(reader.result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });
}

async function deliverExport(file: Blob, filename: string, title: string) {
  if (Capacitor.isNativePlatform()) {
    if (!(await Share.canShare()).value) {
      throw new Error("Sharing is unavailable on this device. Try exporting from the web app instead.");
    }
    const saved = await Filesystem.writeFile({
      path: filename,
      data: await toBase64(file),
      directory: Directory.Cache,
    });
    await Share.share({
      title,
      files: [saved.uri],
      dialogTitle: `Share ${title}`,
    });
    return "shared" as const;
  }

  const url = URL.createObjectURL(file);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return "downloaded" as const;
}

function isShareCancelled(cause: unknown) {
  return cause instanceof Error &&
    (cause.name === "AbortError" || /cancel(?:led|ed)?/i.test(cause.message));
}

interface UseLogbookBackupOptions {
  trainingModes: Record<Pathway, boolean>;
  refreshEntries: () => Promise<void>;
  setError: (message: string | null) => void;
}

export function useLogbookBackup({
  trainingModes,
  refreshEntries,
  setError,
}: UseLogbookBackupOptions) {
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function exportAdminSampleBackup(cases: LogbookCase[]) {
    setIsBusy(true);
    setError(null);
    setStatus(null);
    try {
      const backup = createBackup(cases, {
        lung: true,
        heart: true,
        abdomen: true,
        dvt: true,
        hd: true,
        vascular: true,
      });
      const serialized = JSON.stringify(backup);
      parseBackup(serialized);
      if (new TextEncoder().encode(serialized).byteLength > MAX_BACKUP_SIZE) {
        throw new Error("Sample backup data is larger than the supported 10 MB limit.");
      }
      const file = new Blob([serialized], { type: "application/json" });
      const delivery = await deliverExport(
        file,
        "pocus-logbook-backup-full-admin-sample.json",
        "Full CritSono: POCUS Logbook sample backup",
      );
      return delivery;
    } finally {
      setIsBusy(false);
    }
  }

  async function exportBackup(passphrase: string) {
    setIsBusy(true);
    setError(null);
    setStatus(null);
    try {
      const backup = await createEncryptedLogbookBackup(trainingModes, passphrase);
      const file = new Blob([backup.payload], {
        type: "application/json",
      });
      const filename = `pocus-logbook-backup-${backup.exportedAt.replace(/[:.]/g, "-")}.pocusbackup`;
      const delivery = await deliverExport(file, filename, "Encrypted CritSono: POCUS Logbook backup");
      setStatus(delivery === "shared"
        ? `Encrypted backup prepared for sharing with ${backup.caseCount} ${backup.caseCount === 1 ? "case" : "cases"}. Choose a destination; the app cannot confirm that it was saved.`
        : `Encrypted backup download started with ${backup.caseCount} ${backup.caseCount === 1 ? "case" : "cases"}. Keep your passphrase safe; it cannot be recovered.`);
    } catch (cause) {
      if (isShareCancelled(cause)) {
        setStatus("Backup sharing was cancelled. No save was confirmed.");
      } else {
        setError(messageFrom(cause, "The backup could not be created or shared. Your cases remain stored on this device."));
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function exportCsv(cases: LogbookCase[], pathway: Pathway) {
    setIsBusy(true);
    setError(null);
    setStatus(null);
    try {
      const csv = createCasesCsv(cases, pathway);
      const file = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
      const delivery = await deliverExport(file, csvFilename(pathway), `${pathway} logbook CSV`);
      setStatus(`${delivery === "shared" ? "CSV prepared for sharing" : "CSV download started"} with ${cases.length} ${cases.length === 1 ? "case" : "cases"}. Review free-text fields for patient-identifying details before sharing.`);
    } catch (cause) {
      if (isShareCancelled(cause)) {
        setStatus("CSV sharing was cancelled. No save was confirmed.");
      } else {
        setError(messageFrom(cause, "The CSV export could not be created or shared."));
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function restoreBackupFromFile(event: ChangeEvent<HTMLInputElement>, passphrase: string) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    setIsBusy(true);
    setError(null);
    setStatus(null);
    try {
      if (file.size > MAX_BACKUP_FILE_SIZE) {
        throw new Error("Backup files must be 15 MB or smaller.");
      }
      const serialized = await file.text();
      const result = await restoreBackupFile(serialized, passphrase);
      await refreshEntries();
      setStatus(
        `Restore complete: ${result.addedCases} ${result.addedCases === 1 ? "case" : "cases"} added, ${result.skippedCases} existing ${result.skippedCases === 1 ? "case" : "cases"} kept. Current cases and preferences were not replaced.`,
      );
    } catch (cause) {
      setError(messageFrom(cause, "The backup could not be read or restored."));
    } finally {
      setIsBusy(false);
    }
  }

  async function uploadBackupToGoogleDrive(passphrase: string, clientId: string) {
    // Start OAuth before awaiting local reads/encryption so the browser sees a user gesture.
    const accessToken = requestGoogleDriveAccess(clientId);
    setIsBusy(true);
    setError(null);
    setStatus(null);
    try {
      const token = await accessToken;
      const backup = await createEncryptedLogbookBackup(trainingModes, passphrase);
      const uploaded = await googleDriveBackupProvider.upload(token, backup.payload);
      const uploadedAt = uploaded.modifiedAt ? new Date(uploaded.modifiedAt).toLocaleString() : "just now";
      setStatus(`Encrypted backup uploaded to Google Drive (${uploadedAt}). Keep your passphrase safe; it is not stored by the app.`);
    } catch (cause) {
      setError(messageFrom(cause, "The encrypted backup could not be uploaded to Google Drive."));
    } finally {
      setIsBusy(false);
    }
  }

  async function restoreBackupFromGoogleDrive(passphrase: string, clientId: string) {
    // Start OAuth synchronously from the button click to avoid popup blocking.
    const accessToken = requestGoogleDriveAccess(clientId);
    setIsBusy(true);
    setError(null);
    setStatus(null);
    try {
      const token = await accessToken;
      const downloaded = await googleDriveBackupProvider.downloadLatest(token);
      const result = await restoreEncryptedLogbookBackup(downloaded.payload, passphrase);
      await refreshEntries();
      setStatus(`Restored ${downloaded.name}: ${result.addedCases} ${result.addedCases === 1 ? "case" : "cases"} added, ${result.skippedCases} existing ${result.skippedCases === 1 ? "case" : "cases"} kept. Current cases and preferences were not replaced.`);
    } catch (cause) {
      setError(messageFrom(cause, "The Google Drive backup could not be downloaded or restored."));
    } finally {
      setIsBusy(false);
    }
  }

  return {
    status,
    isBusy,
    exportAdminSampleBackup,
    exportBackup,
    exportCsv,
    restoreBackupFromFile,
    uploadBackupToGoogleDrive,
    restoreBackupFromGoogleDrive,
  };
}
