import {
  HEART_FINDINGS,
  LUNG_FINDINGS,
  LUNG_REGIONS,
  PATHWAYS,
  type LogbookCase,
} from "../domain/logbook";
import {
  ASSESSMENT_LABELS,
  formatCaseDate,
  formatImageQuality,
  formatImpression,
  formatManagementImpact,
  formatSupervision,
} from "../domain/case-display";

interface CaseReviewProps {
  entry: LogbookCase;
  onEdit: () => void;
  onClose: () => void;
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="review-field">
      <dt>{label}</dt>
      <dd>{value.trim() || "Not recorded"}</dd>
    </div>
  );
}

function CaseReview({ entry, onEdit, onClose }: CaseReviewProps) {
  const caseType =
    entry.caseType === "healthy_volunteer" ? "Healthy volunteer" : "Clinical scan";
  const supervision = formatSupervision(entry);
  const impression = formatImpression(entry.impressionCategory);
  const management = formatManagementImpact(entry.managementImpact);
  const imageQuality = formatImageQuality(entry.imageQuality);

  return (
    <section className="case-review" aria-labelledby="review-title">
      <header className="case-review-heading">
        <div>
          <p className="eyebrow">{PATHWAYS[entry.pathway].label} · Case review</p>
          <h2 id="review-title">{entry.diagnosis || "Scan recorded"}</h2>
          <p className="case-review-date">
            {formatCaseDate(entry.date, "en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="case-review-actions">
          <button className="button button-secondary" type="button" onClick={onClose}>
            Back to cases
          </button>
          <button className="button button-primary" type="button" onClick={onEdit}>
            Edit case
          </button>
        </div>
      </header>

      <section className="review-section" aria-labelledby="review-details-title">
        <h3 id="review-details-title">Case details</h3>
        <dl className="review-fields">
          <ReviewField label="Case type" value={caseType} />
          <ReviewField label="Indication" value={entry.indication} />
          <ReviewField label="Diagnosis / impression" value={entry.diagnosis} />
          <ReviewField label="Supervision" value={supervision} />
          <ReviewField label="Impression category" value={impression} />
          <ReviewField label="Management impact" value={management} />
          <ReviewField label="Image quality" value={imageQuality} />
          <ReviewField label="Ventilatory support" value={entry.ventilatorySupport} />
          {entry.pathway === "heart" && (
            <>
              <ReviewField
                label="Cardiovascular support"
                value={entry.cardiovascularSupport}
              />
              <ReviewField label="Heart rate" value={entry.heartRate} />
              <ReviewField label="Blood pressure" value={entry.bloodPressure} />
              <ReviewField
                label="Central venous pressure"
                value={entry.centralVenousPressure}
              />
            </>
          )}
        </dl>
      </section>

      {entry.pathway === "lung" ? (
        <section className="review-section" aria-labelledby="review-scan-title">
          <h3 id="review-scan-title">Lung regions and findings</h3>
          <div className="review-region-list">
            {LUNG_REGIONS.map((region) => (
              <section className="review-region" key={region}>
                <h4>
                  {region}
                  <span>
                    {entry.regions.includes(region) ? "Recorded" : "Not recorded"}
                  </span>
                </h4>
                <dl className="review-finding-list">
                  {LUNG_FINDINGS.map(([key, label]) => (
                    <ReviewField
                      key={key}
                      label={label}
                      value={ASSESSMENT_LABELS[entry.findings[region][key]]}
                    />
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="review-section" aria-labelledby="review-views-title">
            <h3 id="review-views-title">Views obtained</h3>
            {entry.views.length ? (
              <ul className="review-chip-list">
                {entry.views.map((view) => <li key={view}>{view}</li>)}
              </ul>
            ) : (
              <p className="review-empty">No views recorded</p>
            )}
          </section>
          <section className="review-section" aria-labelledby="review-findings-title">
            <h3 id="review-findings-title">Assessment findings</h3>
            <dl className="review-finding-list review-heart-findings">
              {HEART_FINDINGS.map(([key, label]) => (
                <ReviewField
                  key={key}
                  label={label}
                  value={ASSESSMENT_LABELS[entry.findings[key]]}
                />
              ))}
            </dl>
          </section>
        </>
      )}

      <section className="review-section" aria-labelledby="review-notes-title">
        <h3 id="review-notes-title">Notes and reflection</h3>
        <dl className="review-notes">
          <ReviewField label="Summary of findings" value={entry.summary} />
          <ReviewField
            label="Reflection / points to review"
            value={entry.reflection}
          />
        </dl>
      </section>
    </section>
  );
}

export default CaseReview;
