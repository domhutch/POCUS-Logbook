import { useCallback, useEffect, useState } from "react";
import {
  getCases,
  getPathwayModes,
} from "../storage/logbook-store";
import type { LogbookCase, Pathway } from "../domain/logbook";

const INITIAL_TRAINING_MODES: Record<Pathway, boolean> = {
  lung: true,
  heart: true,
};

function errorMessage(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}

export function useLogbookData() {
  const [entries, setEntries] = useState<LogbookCase[]>([]);
  const [trainingModes, setTrainingModes] =
    useState<Record<Pathway, boolean>>(INITIAL_TRAINING_MODES);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshEntries = useCallback(async () => {
    const [storedEntries, storedModes] = await Promise.all([
      getCases(),
      getPathwayModes(),
    ]);
    setEntries(storedEntries);
    setTrainingModes((current) => ({ ...current, ...storedModes }));
    setIsReady(true);
    setError(null);
  }, []);

  useEffect(() => {
    const handleBlockedUpgrade = () => {
      setError(
        "Close other POCUS Logbook tabs or app windows, then retry the database upgrade.",
      );
    };
    window.addEventListener("pocus-logbook-upgrade-blocked", handleBlockedUpgrade);

    void refreshEntries().catch((cause: unknown) => {
      setError(errorMessage(cause, "The on-device logbook could not be opened."));
    });

    return () => {
      window.removeEventListener("pocus-logbook-upgrade-blocked", handleBlockedUpgrade);
    };
  }, [refreshEntries]);

  return {
    entries,
    trainingModes,
    setTrainingModes,
    isReady,
    error,
    setError,
    refreshEntries,
  };
}
