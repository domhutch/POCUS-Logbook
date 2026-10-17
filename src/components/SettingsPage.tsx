import { useState, type FormEvent } from "react";
import type { AppSettings, TextSize } from "../storage/logbook-store";

interface SettingsPageProps {
  settings: AppSettings;
  isSaving: boolean;
  status: string | null;
  onSave: (settings: AppSettings) => void;
}

const TEXT_SIZES: { value: TextSize; label: string; description: string }[] = [
  { value: "small", label: "Small", description: "More content on screen" },
  { value: "default", label: "Default", description: "Original app size" },
  { value: "large", label: "Large", description: "Larger text and controls" },
];

function SettingsPage({ settings, isSaving, status, onSave }: SettingsPageProps) {
  const [newSupervisor, setNewSupervisor] = useState("");

  function updateSettings(next: AppSettings) {
    onSave(next);
  }

  function addSupervisor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newSupervisor.trim();
    if (!name || settings.supervisors.some((item) => item.toLocaleLowerCase() === name.toLocaleLowerCase())) return;
    updateSettings({ ...settings, supervisors: [...settings.supervisors, name] });
    setNewSupervisor("");
  }

  return (
    <section className="settings-page" aria-labelledby="settings-heading">
      <div className="settings-heading">
        <div>
          <p className="eyebrow">Personalise your logbook</p>
          <h2 id="settings-heading">Settings</h2>
          <p>Manage reusable choices and display preferences for this device.</p>
        </div>
      </div>

      <section className="settings-panel" aria-labelledby="text-size-heading">
        <div className="settings-panel-heading">
          <h3 id="text-size-heading">Text size</h3>
          <p>Adjust the size of text and controls throughout the app.</p>
        </div>
        <div className="text-size-options" role="group" aria-label="Text size">
          {TEXT_SIZES.map((option) => (
            <button
              className={`text-size-option ${settings.textSize === option.value ? "is-active" : ""}`}
              type="button"
              key={option.value}
              aria-pressed={settings.textSize === option.value}
              disabled={isSaving}
              onClick={() => updateSettings({ ...settings, textSize: option.value })}
            >
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-panel" aria-labelledby="supervisors-heading">
        <div className="settings-panel-heading">
          <h3 id="supervisors-heading">Supervisors</h3>
          <p>Add names you use often. They will be available to select when recording a supervised case.</p>
        </div>
        <form className="supervisor-add-form" onSubmit={addSupervisor}>
          <label className="settings-field">
            <span>Add a supervisor</span>
            <input
              type="text"
              maxLength={100}
              value={newSupervisor}
              onChange={(event) => setNewSupervisor(event.currentTarget.value)}
              placeholder="Supervisor name"
              disabled={isSaving}
            />
          </label>
          <button className="button button-primary" type="submit" disabled={isSaving || !newSupervisor.trim()}>
            Add supervisor
          </button>
        </form>
        {settings.supervisors.length > 0 ? (
          <ul className="supervisor-settings-list">
            {settings.supervisors.map((name) => (
              <li key={name}>
                <span>{name}</span>
                <button
                  className="text-button text-button-danger"
                  type="button"
                  disabled={isSaving}
                  onClick={() => updateSettings({
                    ...settings,
                    supervisors: settings.supervisors.filter((item) => item !== name),
                  })}
                  aria-label={`Remove ${name} from saved supervisors`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="settings-empty">No supervisors saved yet. You can still enter a name directly on a case.</p>
        )}
      </section>
      <p className="settings-status" role="status">{status ?? "Settings are stored on this device and are not included in logbook backups."}</p>
    </section>
  );
}

export default SettingsPage;
