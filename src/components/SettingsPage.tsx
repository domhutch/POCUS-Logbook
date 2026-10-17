import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { LogbookCase } from "../domain/logbook";
import type { AppSettings, TextSize } from "../storage/logbook-store";
import { PATHWAYS, type Pathway } from "../domain/logbook";
import AboutHelpPage from "./AboutHelpPage";

interface SettingsPageProps {
  settings: AppSettings;
  isSaving: boolean;
  status: string | null;
  cases: LogbookCase[];
  isHandlingBackup: boolean;
  backupStatus: string | null;
  onSave: (settings: AppSettings) => void;
  onPrintLogbook: () => void;
  onDownloadCaseReports: () => void;
  onExportCsv: () => void;
  onExportBackup: (passphrase: string) => Promise<void>;
  onRestoreBackup: (event: ChangeEvent<HTMLInputElement>, passphrase: string) => Promise<void>;
}

const TEXT_SIZES: { value: TextSize; label: string; description: string }[] = [
  { value: "small", label: "Small", description: "More content on screen" },
  { value: "default", label: "Default", description: "Larger text, standard buttons" },
  { value: "large", label: "Large", description: "Largest text and controls" },
];

function SettingsPage({
  settings,
  isSaving,
  status,
  cases,
  isHandlingBackup,
  backupStatus,
  onSave,
  onPrintLogbook,
  onDownloadCaseReports,
  onExportCsv,
  onExportBackup,
  onRestoreBackup,
}: SettingsPageProps) {
  const [newSupervisor, setNewSupervisor] = useState("");
  const [backupPassphrase, setBackupPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [showAboutHelp, setShowAboutHelp] = useState(false);
  const backupInputRef = useRef<HTMLInputElement>(null);

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

  if (showAboutHelp) {
    return <AboutHelpPage onBack={() => setShowAboutHelp(false)} />;
  }

  return (
    <section
      className="settings-page"
      aria-labelledby="settings-heading"
    >
      <div className="settings-heading">
        <div>
          <p className="eyebrow">Personalise your logbook</p>
          <h2 id="settings-heading">Settings</h2>
          <p>Manage local preferences, backups, and exports.</p>
        </div>
        <button
          className="button button-secondary"
          type="button"
          onClick={() => setShowAboutHelp(true)}
        >
          About &amp; Help
        </button>
      </div>

      <section className="settings-panel" aria-labelledby="text-size-heading">
        <div className="settings-panel-heading">
          <h3 id="text-size-heading">Text size</h3>
          <p>Choose a text size. Default uses larger text with standard button sizing.</p>
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

      <section className="settings-panel" aria-labelledby="curriculum-heading">
        <div className="settings-panel-heading">
          <h3 id="curriculum-heading">Curriculum and modules</h3>
          <p>Choose the curriculum and the modules you want available in your logbook.</p>
        </div>
        <label className="settings-field curriculum-field">
          <span>Curriculum</span>
          <select
            value={settings.curriculum}
            disabled={isSaving}
            onChange={() => updateSettings({ ...settings, curriculum: "fusic" })}
          >
            <option value="fusic">FUSIC</option>
          </select>
          <small>FUSIC is currently the available curriculum.</small>
        </label>
        <div className="module-toggle-list" role="group" aria-label="FUSIC modules">
          {(Object.keys(PATHWAYS) as Pathway[]).map((module) => {
            const enabled = settings.enabledModules[module];
            const isLastEnabled = enabled && Object.values(settings.enabledModules).filter(Boolean).length === 1;
            return (
              <label className="module-toggle" key={module}>
                <span>
                  <strong>{PATHWAYS[module].label}</strong>
                  <small>{enabled ? "Available in the logbook" : "Hidden from the logbook"}</small>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={enabled}
                  disabled={isSaving || isLastEnabled}
                  onChange={(event) => updateSettings({
                    ...settings,
                    enabledModules: {
                      ...settings.enabledModules,
                      [module]: event.currentTarget.checked,
                    },
                  })}
                  aria-label={`${PATHWAYS[module].label} module`}
                />
              </label>
            );
          })}
        </div>
      </section>

      <section className="settings-panel" aria-labelledby="backup-heading">
        <div className="settings-panel-heading">
          <h3 id="backup-heading">Backup and exports</h3>
          <p>Encrypted backup files are protected with a passphrase you choose. The app does not store or recover it. CSV and PDF exports remain readable.</p>
        </div>
        <label className="settings-field">
          <span>Backup passphrase</span>
          <input
            type="password"
            autoComplete="off"
            value={backupPassphrase}
            onChange={(event) => setBackupPassphrase(event.currentTarget.value)}
            disabled={isHandlingBackup}
          />
          <small>Use a memorable, unique passphrase of at least 14 characters. Keep it separate from the backup file.</small>
        </label>
        <label className="settings-field">
          <span>Confirm passphrase for export</span>
          <input
            type="password"
            autoComplete="off"
            value={confirmPassphrase}
            onChange={(event) => setConfirmPassphrase(event.currentTarget.value)}
            disabled={isHandlingBackup}
          />
        </label>
        <div className="backup-actions">
          <button className="button button-secondary" type="button" onClick={onPrintLogbook}>Print logbook / PDF</button>
          <button className="button button-secondary" type="button" onClick={onDownloadCaseReports} disabled={!cases.length}>Download all case reports PDF</button>
          <button className="button button-secondary" type="button" onClick={onExportCsv} disabled={isHandlingBackup}>Export CSV</button>
          <button
            className="button button-secondary"
            type="button"
            disabled={isHandlingBackup || backupPassphrase.length < 14 || backupPassphrase !== confirmPassphrase}
            onClick={() => void onExportBackup(backupPassphrase).finally(() => {
              setBackupPassphrase("");
              setConfirmPassphrase("");
            })}
          >
            Export encrypted backup
          </button>
          <button className="button button-primary" type="button" disabled={isHandlingBackup} onClick={() => backupInputRef.current?.click()}>
            Restore / merge backup
          </button>
          <input
            ref={backupInputRef}
            className="sr-only"
            type="file"
            accept=".pocusbackup,.json,application/json"
            aria-label="Choose an encrypted CritSono: POCUS Logbook backup file"
            onChange={(event) => void onRestoreBackup(event, backupPassphrase).finally(() => {
              setBackupPassphrase("");
              setConfirmPassphrase("");
            })}
          />
        </div>
        <p className="backup-privacy">New backups are encrypted on this device before export. Older unencrypted JSON backups can still be restored. PDF and CSV exports are not encrypted; check free-text fields before sharing them. Keep the passphrase separate: it cannot be reset or recovered.</p>
        {backupStatus && <p className="backup-status" role="status">{backupStatus}</p>}
      </section>
      <p className="settings-status" role="status">{status ?? "Settings are stored on this device and are not included in logbook backups."}</p>
    </section>
  );
}

export default SettingsPage;
