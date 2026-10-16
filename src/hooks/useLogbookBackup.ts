import { useState, type ChangeEvent } from "react";
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
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pocus-logbook-backup-${backup.exportedAt.replace(/[:.]/g, "-")}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus(
        `Backup downloaded with ${storedCases.length} ${storedCases.length === 1 ? "case" : "cases"}. Save the file somewhere private.`,
      );
    } catch (cause) {
      setError(messageFrom(cause, "A backup could not be created or downloaded."));
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
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = csvFilename(pathway);
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus(`CSV exported with ${cases.length} ${cases.length === 1 ? "case" : "cases"}. Review free-text fields for patient-identifying details before sharing.`);
    } catch (cause) {
      setError(messageFrom(cause, "A CSV export could not be created or downloaded."));
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
