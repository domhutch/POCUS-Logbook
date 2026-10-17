import type { CaseMixSummary, TrainingProgress } from "../domain/metrics";
import { PATHWAYS, type Pathway } from "../domain/logbook";

interface OverviewPageProps {
  pathway: Pathway;
  enabledPathways: Pathway[];
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
  onTrainingModeChange: (enabled: boolean) => void;
  onShowCases: () => void;
  onPopulateTestCases: (pathway: Pathway) => void;
  onExportFullTestData: () => void;
  onClearTestCases: () => void;
  onPreviewWelcome: () => void;
}

function OverviewPage({
  pathway,
  enabledPathways,
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
  onTrainingModeChange,
  onShowCases,
  onPopulateTestCases,
  onExportFullTestData,
  onClearTestCases,
  onPreviewWelcome,
}: OverviewPageProps) {
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
            {caseMix.minimumPositiveScans !== null && (
              <p className="case-mix-note">
                DVT-positive scans: {caseMix.positiveScans ?? 0} / {caseMix.minimumPositiveScans} required
              </p>
            )}
            {caseMix.normalScanMaximum !== null && (
              <div className="case-mix-note">
                <p>Normal scans: {caseMix.normalScans} / {caseMix.normalScanMaximum} maximum</p>
                <small>Counted from cases marked “Normal” in Impression category.</small>
              </div>
            )}
            {caseMix.scanTypeQuotas.length > 0 ? (
              <ul className="case-mix-quotas">
                {caseMix.scanTypeQuotas.map((quota) => (
                  <li key={quota.scanType}>
                    <strong>{quota.scanType}</strong>
                    <span>{quota.recordedScans} / {quota.minimumScans} scans · {quota.supervisedScans} / {quota.minimumDirectlySupervised} directly supervised</span>
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

      {canManageTestData && (
        <details className="test-data-panel">
          <summary>Admin test data · {sampleCaseCount} sample cases on this device</summary>
          <p>
            Add clearly labelled sample cases to this device to test the hosted
            app. They are included in backups. Adding them again won’t duplicate
            existing sample cases.
          </p>
          <div className="test-data-actions">
            <button className="button button-primary" type="button" onClick={onExportFullTestData} disabled={isHandlingTestData || !isReady}>
              Download full sample backup (all pathways)
            </button>
            <button className="button button-secondary" type="button" onClick={onPreviewWelcome}>
              Preview welcome screen
            </button>
            {enabledPathways.map((key) => (
              <button
                className="button button-secondary"
                type="button"
                key={key}
                onClick={() => onPopulateTestCases(key)}
                disabled={isHandlingTestData || !isReady}
              >
                Add full {PATHWAYS[key].label} sample set
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
          <small>Full sample sets contain one complete structured case per target scan and are clearly marked in the Cases list. The downloaded JSON is synthetic and can be restored from Settings → Restore / merge backup.</small>
        </details>
      )}
    </>
  );
}

export default OverviewPage;
