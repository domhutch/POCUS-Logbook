import { useState } from "react";
import { createAdminSampleCases, createFullAdminSampleCases } from "../domain/admin-sample-data";
import { isSampleCase, PATHWAYS, type LogbookCase, type Pathway } from "../domain/logbook";
import { addSampleCases, deleteSampleCases } from "../storage/logbook-store";

type UseSampleDataManagementOptions = {
  entries: LogbookCase[];
  refreshEntries: () => Promise<void>;
  exportFullBackup: (cases: LogbookCase[]) => Promise<"shared" | "downloaded">;
  setError: (message: string | null) => void;
};

export function useSampleDataManagement({
  entries,
  refreshEntries,
  exportFullBackup,
  setError,
}: UseSampleDataManagementOptions) {
  const [isHandlingTestData, setIsHandlingTestData] = useState(false);
  const [testDataStatus, setTestDataStatus] = useState<string | null>(null);
  const sampleCaseCount = entries.filter(isSampleCase).length;

  async function populateCases(pathway: Pathway) {
    setIsHandlingTestData(true);
    setTestDataStatus(null);
    try {
      const addedCount = await addSampleCases(createAdminSampleCases(pathway));
      await refreshEntries();
      const pathwayName = PATHWAYS[pathway].label;
      setTestDataStatus(
        addedCount > 0
          ? `Added ${addedCount} ${pathwayName} sample cases to this device.`
          : `${pathwayName} sample cases are already on this device.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Sample cases could not be added to this device.",
      );
    } finally {
      setIsHandlingTestData(false);
    }
  }

  async function exportFullDataset() {
    setIsHandlingTestData(true);
    setTestDataStatus(null);
    setError(null);
    try {
      const cases = createFullAdminSampleCases();
      const delivery = await exportFullBackup(cases);
      setTestDataStatus(
        delivery === "shared"
          ? `Prepared a full ${cases.length}-case sample backup to share. Restore / merge it from Settings.`
          : `Downloaded a full ${cases.length}-case sample backup. Restore / merge it from Settings.`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The full sample backup could not be exported.");
    } finally {
      setIsHandlingTestData(false);
    }
  }

  async function clearCases() {
    if (sampleCaseCount === 0) return;
    if (
      !window.confirm(
        `Remove ${sampleCaseCount} clearly marked sample cases from this device? Real cases will not be changed.`,
      )
    ) {
      return;
    }
    setIsHandlingTestData(true);
    setTestDataStatus(null);
    try {
      const removedCount = await deleteSampleCases();
      await refreshEntries();
      setTestDataStatus(`Removed ${removedCount} sample cases.`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Sample cases could not be removed from this device.",
      );
    } finally {
      setIsHandlingTestData(false);
    }
  }

  return {
    sampleCaseCount,
    isHandlingTestData,
    testDataStatus,
    populateCases,
    exportFullDataset,
    clearCases,
  };
}
