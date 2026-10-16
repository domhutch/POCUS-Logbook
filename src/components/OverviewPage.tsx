import { useRef, type ChangeEvent } from "react";
import { PATHWAYS, type Pathway } from "../domain/logbook";

interface OverviewPageProps {
  pathway: Pathway;
  caseCount: number;
  supervisedCount: number;
  abnormalCount: number;
  changedManagementCount: number;
  trainingMode: boolean;
  isReady: boolean;
  isHandlingBackup: boolean;
  backupStatus: string | null;
  onTrainingModeChange: (enabled: boolean) => void;
  onShowCases: () => void;
  onExportBackup: () => void;
  onRestoreBackup: (event: ChangeEvent<HTMLInputElement>) => void;
}

function OverviewPage({
  pathway,
  caseCount,
  supervisedCount,
  abnormalCount,
  changedManagementCount,
  trainingMode,
  isReady,
  isHandlingBackup,
  backupStatus,
  onTrainingModeChange,
  onShowCases,
  onExportBackup,
  onRestoreBackup,
}: OverviewPageProps) {
  const backupInputRef = useRef<HTMLInputElement>(null);
  const details = PATHWAYS[pathway];

  return (
    <>
      <section className="pathway-heading" aria-labelledby="pathway-title">
        <div>
          <p className="eyebrow">Personal logbook</p>
          <h2 id="pathway-title">{details.label}</h2>
          <p className="pathway-description">{details.description}</p>
        </div>
        <label className="mode-switch">
          <span>
            <strong>Training progress</strong>
            <small>{trainingMode ? "Targets are visible" : "Targets are hidden"}</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={trainingMode}
            onChange={(event) => onTrainingModeChange(event.currentTarget.checked)}
            aria-label={`Show ${details.label} training progress`}
          />
        </label>
      </section>

      <section
        className={`stats-grid ${trainingMode ? "stats-grid-training" : ""}`}
        aria-label={`${details.label} ${trainingMode ? "training totals" : "review summary"}`}
      >
        <button
          className="stat-card stat-card-featured stat-card-action"
          type="button"
          onClick={onShowCases}
          aria-label={`View ${caseCount} ${caseCount === 1 ? "case" : "cases"}`}
        >
          <span className="stat-label">Cases logged</span>
          <strong className="stat-value">
            {caseCount}
            {trainingMode && <span className="stat-reference"> / {details.totalTarget}</span>}
          </strong>
          <span className="stat-note">{trainingMode ? "Training case reference" : "All recorded scans"}</span>
        </button>
        {trainingMode ? (
          <article className="stat-card">
            <span className="stat-label">Directly supervised</span>
            <strong className="stat-value">{supervisedCount}<span className="stat-reference"> / {details.supervisedTarget}</span></strong>
            <span className="stat-note">Direct supervision reference</span>
          </article>
        ) : (
          <>
            <article className="stat-card">
              <span className="stat-label">Abnormal impressions</span>
              <strong className="stat-value">{abnormalCount}</strong>
              <span className="stat-note">Marked abnormal for review</span>
            </article>
            <article className="stat-card">
              <span className="stat-label">Management changed</span>
              <strong className="stat-value">{changedManagementCount}</strong>
              <span className="stat-note">Marked as changing management</span>
            </article>
          </>
        )}
      </section>

      {trainingMode && (
        <p className="source-note">
          Training references are drawn from the supplied {details.source}. They are a personal aid, not an assessment of eligibility or competence.
        </p>
      )}

      <section className="backup-panel" aria-labelledby="backup-title">
        <div className="backup-copy">
          <p className="eyebrow">Recovery</p>
          <h2 id="backup-title">Keep a safe copy</h2>
          <p>Download a portable backup or merge one into this logbook. Existing cases and preferences are kept on conflicts.</p>
        </div>
        <div className="backup-actions">
          <button className="button button-secondary" onClick={onExportBackup} disabled={isHandlingBackup || !isReady}>Download backup</button>
          <button className="button button-primary" onClick={() => backupInputRef.current?.click()} disabled={isHandlingBackup || !isReady}>Restore backup</button>
          <input
            ref={backupInputRef}
            className="sr-only"
            type="file"
            accept=".json,application/json"
            aria-label="Choose a POCUS Logbook backup file"
            onChange={onRestoreBackup}
          />
        </div>
        <details className="backup-privacy">
          <summary>Backup privacy</summary>
          <p>The JSON backup is readable and not encrypted. Store it somewhere private; don’t upload it to a shared server until encrypted backup support is available.</p>
        </details>
        {backupStatus && <p className="backup-status" role="status">{backupStatus}</p>}
      </section>
    </>
  );
}

export default OverviewPage;
