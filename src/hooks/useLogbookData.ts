import { useCallback, useEffect, useState } from "react";
import {
  getCases,
  getAppSettings,
  getPathwayModes,
  type AppSettings,
} from "../storage/logbook-store";
import type { LogbookCase, Pathway } from "../domain/logbook";

const INITIAL_TRAINING_MODES: Record<Pathway, boolean> = {
  lung: true,
  heart: true,
  abdomen: true,
  dvt: true,
  hd: true,
  vascular: true,
};

function errorMessage(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}

export function useLogbookData() {
  const [entries, setEntries] = useState<LogbookCase[]>([]);
  const [trainingModes, setTrainingModes] =
    useState<Record<Pathway, boolean>>(INITIAL_TRAINING_MODES);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    supervisors: [],
    operatorName: "",
    textSize: "default",
    textScaleVersion: 2,
    curriculum: "fusic",
    enabledModules: { heart: true, lung: true, abdomen: false, dvt: false, hd: false, vascular: false },
    onboardingComplete: false,
  });
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshEntries = useCallback(async () => {
    const [storedEntries, storedModes, storedAppSettings] = await Promise.all([
      getCases(),
      getPathwayModes(),
      getAppSettings(),
    ]);
    setEntries(storedEntries);
    setTrainingModes((current) => ({ ...current, ...storedModes }));
    setAppSettings(storedAppSettings);
    setIsReady(true);
    setError(null);
  }, []);

  useEffect(() => {
    const handleBlockedUpgrade = () => {
      setError(
        "Close other CritSono: POCUS Logbook tabs or app windows, then retry the database upgrade.",
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
    appSettings,
    setAppSettings,
    isReady,
    error,
    setError,
    refreshEntries,
  };
}
