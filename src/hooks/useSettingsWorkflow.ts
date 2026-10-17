import { useState } from "react";
import { PATHWAYS, type Pathway } from "../domain/logbook";
import { saveAppSettings, savePathwayMode, type AppSettings } from "../storage/logbook-store";

type UseSettingsWorkflowOptions = {
  activePathway: Pathway;
  setActivePathway: (pathway: Pathway) => void;
  setAppSettings: (settings: AppSettings) => void;
  setTrainingModes: (update: (current: Record<Pathway, boolean>) => Record<Pathway, boolean>) => void;
  setError: (message: string | null) => void;
};

export function useSettingsWorkflow({
  activePathway,
  setActivePathway,
  setAppSettings,
  setTrainingModes,
  setError,
}: UseSettingsWorkflowOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function changeTrainingMode(enabled: boolean) {
    try {
      await savePathwayMode(activePathway, enabled);
      setTrainingModes((current) => ({ ...current, [activePathway]: enabled }));
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The pathway view preference could not be saved.",
      );
    }
  }

  async function saveSettings(nextSettings: AppSettings) {
    setIsSaving(true);
    setStatus(null);
    try {
      await saveAppSettings(nextSettings);
      setAppSettings(nextSettings);
      setStatus("Settings saved on this device.");
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Settings could not be saved on this device.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function completeOnboarding(nextSettings: AppSettings) {
    setIsSaving(true);
    setError(null);
    try {
      await saveAppSettings(nextSettings);
      setAppSettings(nextSettings);
      const firstEnabledPathway = (Object.keys(PATHWAYS) as Pathway[]).find(
        (pathway) => nextSettings.enabledModules[pathway],
      );
      if (firstEnabledPathway) setActivePathway(firstEnabledPathway);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your setup could not be saved on this device.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return { isSaving, status, changeTrainingMode, saveSettings, completeOnboarding };
}
