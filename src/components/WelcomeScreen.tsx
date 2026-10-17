import { useEffect, useState } from "react";
import { PATHWAYS, type Pathway } from "../domain/logbook";
import type { AppSettings, TextSize } from "../storage/logbook-store";
import BrowserStorageGuidance from "./BrowserStorageGuidance";

interface WelcomeScreenProps {
  settings: AppSettings;
  isSaving: boolean;
  error: string | null;
  onComplete: (settings: AppSettings) => void;
  isPreview?: boolean;
  onExitPreview?: () => void;
}

const TEXT_SIZES: { value: TextSize; label: string; description: string }[] = [
  { value: "small", label: "Small", description: "More content on screen" },
  { value: "default", label: "Default", description: "Larger text, standard buttons" },
  { value: "large", label: "Large", description: "Largest text and controls" },
];

function WelcomeScreen({ settings, isSaving, error, onComplete, isPreview = false, onExitPreview }: WelcomeScreenProps) {
  const [textSize, setTextSize] = useState(settings.textSize);
  const [enabledModules, setEnabledModules] = useState(settings.enabledModules);
  const pathways = Object.keys(PATHWAYS) as Pathway[];
  const enabledCount = Object.values(enabledModules).filter(Boolean).length;

  useEffect(() => {
    document.documentElement.dataset.textSize = textSize;
  }, [textSize]);

  function toggleModule(module: Pathway) {
    setEnabledModules((current) => {
      if (current[module] && Object.values(current).filter(Boolean).length === 1) return current;
      return { ...current, [module]: !current[module] };
    });
  }

  return (
    <main className="welcome-screen" aria-labelledby="welcome-title">
      <div className="welcome-card">
        <p className="eyebrow">Your personal POCUS logbook</p>
        <h1 id="welcome-title">Welcome</h1>
        <p className="welcome-intro">
          Set up your logbook to match the pathways you’re working on. You can change these choices any time in Settings.
        </p>
        {isPreview && <p className="welcome-preview-notice" role="status">Preview only · changes on this screen won’t be saved.</p>}

        <fieldset className="welcome-section">
          <legend>Choose your modules</legend>
          <p>Select the pathways you want in your logbook. You can turn others on later.</p>
          <div className="welcome-module-list">
            {pathways.map((module) => (
              <label className="welcome-module-option" key={module}>
                <input
                  type="checkbox"
                  checked={enabledModules[module]}
                  disabled={enabledModules[module] && enabledCount === 1}
                  onChange={() => toggleModule(module)}
                />
                <span className="welcome-module-icon" aria-hidden="true">{PATHWAYS[module].icon}</span>
                <span><strong>{PATHWAYS[module].label}</strong><small>{PATHWAYS[module].description}</small></span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="welcome-section">
          <legend>Choose a text size</legend>
          <p>You can adjust this later in Settings.</p>
          <div className="text-size-options" role="group" aria-label="Text size">
            {TEXT_SIZES.map((option) => (
              <button
                className={`text-size-option ${textSize === option.value ? "is-active" : ""}`}
                type="button"
                key={option.value}
                aria-pressed={textSize === option.value}
                onClick={() => setTextSize(option.value)}
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <aside className="welcome-backup-note" aria-labelledby="welcome-backup-title">
          <h2 id="welcome-backup-title">Keep your backups recoverable</h2>
          <p>
            Encrypted backups are optional. If you choose to use one, create a strong passphrase and save it in a password manager before making the backup. The app never stores or recovers it, and you’ll need it to restore your file. You can set this up later in Settings.
          </p>
        </aside>

        <details className="welcome-storage-details">
          <summary>How to keep your logbook data in this browser</summary>
          <BrowserStorageGuidance />
        </details>

        {error && <p className="welcome-error" role="alert">{error}</p>}
        <button
          className="button button-primary welcome-continue"
          type="button"
          disabled={!isPreview && (isSaving || enabledCount === 0)}
          onClick={() => isPreview ? onExitPreview?.() : onComplete({ ...settings, textSize, enabledModules, onboardingComplete: true })}
        >
          {isPreview ? "Return to admin view" : isSaving ? "Saving your setup…" : "Continue to your logbook"}
        </button>
        <p className="welcome-local-note">Your cases and preferences stay on this device unless you choose to export or back them up.</p>
      </div>
    </main>
  );
}

export default WelcomeScreen;
