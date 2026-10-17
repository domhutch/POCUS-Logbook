import { useState, type ChangeEvent } from "react";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { createBackup, parseBackup } from "../domain/backup";
import { csvFilename, createCasesCsv } from "../domain/case-csv";
import type { LogbookCase, Pathway } from "../domain/logbook";
import {
  getCases,
  getPathwayModes,
  restoreBackup,
} from "../storage/logbook-store";

const MAX_BACKUP_SIZE = 10 * 1024 * 1024;

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

  async function exportBackup() {
    setIsBusy(true);
    setError(null);
    setStatus(null);
    try {
      const [storedCases, storedModes] = await Promise.all([
        getCases(),
        getPathwayModes(),
      ]);
      const backup = createBackup(storedCases, {
        lung: storedModes.lung ?? trainingModes.lung,
        heart: storedModes.heart ?? trainingModes.heart,
      });
      const file = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const filename = `pocus-logbook-backup-${backup.exportedAt.replace(/[:.]/g, "-")}.json`;
      const delivery = await deliverExport(file, filename, "POCUS Logbook backup");
      setStatus(delivery === "shared"
        ? `Backup prepared for sharing with ${storedCases.length} ${storedCases.length === 1 ? "case" : "cases"}. Choose a private destination in the share sheet; the app cannot confirm that it was saved.`
        : `Backup download started with ${storedCases.length} ${storedCases.length === 1 ? "case" : "cases"}. Save the file somewhere private.`);
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

  async function restoreBackupFromFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    setIsBusy(true);
    setError(null);
    setStatus(null);
    try {
      if (file.size > MAX_BACKUP_SIZE) {
        throw new Error("Backup files must be 10 MB or smaller.");
      }
      const backup = parseBackup(await file.text());
      const result = await restoreBackup(backup);
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

  return { status, isBusy, exportBackup, exportCsv, restoreBackupFromFile };
}
