import { useRef, type ChangeEvent } from "react";
import type { CaseMixSummary, TrainingProgress } from "../domain/metrics";
import { PATHWAYS, type Pathway } from "../domain/logbook";

interface OverviewPageProps {
  pathway: Pathway;
  progress: TrainingProgress;
  abnormalCount: number;
  changedManagementCount: number;
  caseMix: CaseMixSummary;
  canManageTestData: boolean;
  sampleCaseCount: number;
  isHandlingTestData: boolean;
  testDataStatus: string | null;
  trainingMode: boolean;
  isReady: boolean;
  isHandlingBackup: boolean;
  backupStatus: string | null;
  onTrainingModeChange: (enabled: boolean) => void;
  onShowCases: () => void;
  onPrintLogbook: () => void;
  onExportCsv: () => void;
  onExportBackup: () => void;
  onRestoreBackup: (event: ChangeEvent<HTMLInputElement>) => void;
  onPopulateTestCases: (pathway: Pathway) => void;
  onClearTestCases: () => void;
}

function OverviewPage({
  pathway,
  progress,
  abnormalCount,
  changedManagementCount,
  caseMix,
  canManageTestData,
  sampleCaseCount,
  isHandlingTestData,
  testDataStatus,
  trainingMode,
  isReady,
  isHandlingBackup,
  backupStatus,
  onTrainingModeChange,
  onShowCases,
  onPrintLogbook,
  onExportCsv,
  onExportBackup,
  onRestoreBackup,
  onPopulateTestCases,
  onClearTestCases,
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
          aria-label={`View ${progress.totalCases} ${progress.totalCases === 1 ? "case" : "cases"}`}
        >
          <span className="stat-label">Cases logged</span>
          <strong className="stat-value">
            {progress.totalCases}
            {trainingMode && <span className="stat-reference"> / {progress.totalTarget}</span>}
          </strong>
          <span className="stat-note">{trainingMode ? "Training case reference" : "All recorded scans"}</span>
        </button>
        {trainingMode ? (
          <article className="stat-card">
            <span className="stat-label">Directly supervised</span>
            <strong className="stat-value">{progress.supervisedCases}<span className="stat-reference"> / {progress.supervisedTarget}</span></strong>
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
        <>
          <section className="case-mix-panel" aria-labelledby="case-mix-title">
            <div className="case-mix-heading">
              <div>
                <p className="eyebrow">Curriculum guidance</p>
                <h2 id="case-mix-title">Case mix and scan coverage</h2>
              </div>
              <span className="case-mix-source">{details.source}</span>
            </div>
            <div className="case-mix-counts">
              <p><strong>{caseMix.clinicalCases}</strong><span>Clinical cases</span></p>
              <p>
                <strong>{caseMix.healthyVolunteerCases}</strong>
                <span>
                  Healthy volunteers · {caseMix.healthyVolunteerPercent.toFixed(0)}%
                  {caseMix.healthyVolunteerMaximumPercent !== null &&
                    ` / max ${caseMix.healthyVolunteerMaximumPercent}%`}
                </span>
              </p>
            </div>
            {caseMix.pathologyRangeRequired && (
              <p className="case-mix-note">
                The curriculum requires a range of pathology. The logbook does not
                verify pathology variety from free-text diagnoses.
              </p>
            )}
            {caseMix.scanTypeQuotas.length > 0 ? (
              <ul className="case-mix-quotas">
                {caseMix.scanTypeQuotas.map((quota) => (
                  <li key={quota.scanType}>
                    <strong>{quota.scanType}</strong>
                    <span>{quota.minimumScans} scans · {quota.minimumDirectlySupervised} directly supervised</span>
                    {quota.note && <small>{quota.note}</small>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="case-mix-note">
                No separate scan-type minimums are listed for this pathway.
              </p>
            )}
            {caseMix.protocolCoverage && (
              <p className="case-mix-protocol">{caseMix.protocolCoverage}</p>
            )}
          </section>
          <p className="source-note">
            Training references are drawn from the supplied {details.source}. They are a personal aid, not an assessment of eligibility or competence.
          </p>
        </>
      )}

      <section className="backup-panel" aria-labelledby="backup-title">
        <div className="backup-copy">
          <p className="eyebrow">Recovery</p>
          <h2 id="backup-title">Keep a safe copy</h2>
          <p>Download a portable backup or merge one into this logbook. Existing cases and preferences are kept on conflicts.</p>
        </div>
        <div className="backup-actions">
          <button className="button button-secondary" onClick={onPrintLogbook} disabled={!isReady}>Print logbook / PDF</button>
          <button className="button button-secondary" onClick={onExportCsv} disabled={isHandlingBackup || !isReady}>Export CSV</button>
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

      {canManageTestData && (
        <details className="test-data-panel">
          <summary>Admin test data · {sampleCaseCount} sample cases on this device</summary>
          <p>
            Add clearly labelled sample cases to this device to test the hosted
            app. They are included in backups. Adding them again won’t duplicate
            existing sample cases.
          </p>
          <div className="test-data-actions">
            {(Object.keys(PATHWAYS) as Pathway[]).map((key) => (
              <button
                className="button button-secondary"
                type="button"
                key={key}
                onClick={() => onPopulateTestCases(key)}
                disabled={isHandlingTestData || !isReady}
              >
                Add {PATHWAYS[key].label.replace(/^FUSIC\s+/, "")} sample cases
              </button>
            ))}
            <button
              className="button button-secondary"
              type="button"
              onClick={onClearTestCases}
              disabled={isHandlingTestData || sampleCaseCount === 0}
            >
              Remove all sample cases ({sampleCaseCount})
            </button>
          </div>
          {testDataStatus && <p className="test-data-status" role="status">{testDataStatus}</p>}
          <small>Sample cases are marked in the Cases list and case review.</small>
        </details>
      )}
    </>
  );
}

export default OverviewPage;
