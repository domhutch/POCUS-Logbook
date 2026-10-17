import {
  HEART_FINDINGS,
  DVT_SITES,
  DVT_SITE_FINDINGS,
  HD_QUESTIONS,
  HD_MEASUREMENTS,
  VASCULAR_ASSESSMENTS,
  VASCULAR_PROCEDURES,
  isSampleCase,
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
  caseNumber: number;
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

function CaseReview({ entry, caseNumber, onEdit, onClose }: CaseReviewProps) {
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
          <p className="eyebrow">
            {PATHWAYS[entry.pathway].label} · Case review
            {isSampleCase(entry) && " · Sample data"}
          </p>
          <h2 id="review-title">
            {PATHWAYS[entry.pathway].label} Case {caseNumber}
          </h2>
          <p className="case-review-date">
            {formatCaseDate(entry.date, "en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          {entry.diagnosis && <p className="case-review-diagnosis">{entry.diagnosis}</p>}
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
          {(entry.pathway === "lung" || entry.pathway === "heart") && <ReviewField label="Ventilatory support" value={entry.ventilatorySupport} />}
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
      ) : entry.pathway === "heart" ? (
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
      ) : entry.pathway === "abdomen" ? (
        <section className="review-section" aria-labelledby="review-abdomen-title">
          <h3 id="review-abdomen-title">Abdominal findings</h3>
          <div className="review-chip-list">{entry.examinationPoints.map((point) => <span key={point}>{point}</span>)}</div>
          <dl className="review-fields">
            <ReviewField label="RUQ · diaphragm and liver" value={entry.rightUpperQuadrant} />
            <ReviewField label="LUQ · diaphragm and spleen" value={entry.leftUpperQuadrant} />
            <ReviewField label="Right kidney · size and appearance" value={entry.rightKidney} />
            <ReviewField label="Right hydronephrosis" value={entry.rightHydronephrosis.replaceAll("_", " ")} />
            <ReviewField label="Left kidney · size and appearance" value={entry.leftKidney} />
            <ReviewField label="Left hydronephrosis" value={entry.leftHydronephrosis.replaceAll("_", " ")} />
            <ReviewField label="Bladder size" value={entry.bladderSize.replaceAll("_", " ")} />
            <ReviewField label="Bladder location and description" value={entry.bladderDescription} />
            <ReviewField label="Free fluid" value={entry.freeFluid} />
            <ReviewField label="Other comments" value={entry.otherComments} />
          </dl>
        </section>
      ) : entry.pathway === "dvt" ? (
        <section className="review-section" aria-labelledby="review-dvt-title">
          <h3 id="review-dvt-title">Venous findings</h3>
          <div className="review-region-list">
            {DVT_SITES.map((site) => (
              <section className="review-region" key={site}>
                <h4>{site}</h4>
                <dl className="review-finding-list">
                  {DVT_SITE_FINDINGS.map(([key, label]) => (
                    <ReviewField key={key} label={label} value={ASSESSMENT_LABELS[entry.findings[site][key]]} />
                  ))}
                </dl>
              </section>
            ))}
          </div>
          <dl className="review-fields">
            <ReviewField label="Other comments" value={entry.otherComments} />
          </dl>
        </section>
      ) : entry.pathway === "hd" ? (
        <section className="review-section" aria-labelledby="review-hd-title">
          <h3 id="review-hd-title">FUSIC HD clinical questions</h3>
          <dl className="review-finding-list review-heart-findings">
            {HD_QUESTIONS.map(([key, question]) => (
              <ReviewField key={key} label={question} value={`${ASSESSMENT_LABELS[entry.questionFindings[key]]}${entry.questionNotes[key] ? ` · ${entry.questionNotes[key]}` : ""}`} />
            ))}
          </dl>
          <h3>Measurements and Doppler</h3>
          <dl className="review-fields">
            {HD_MEASUREMENTS.map(([key, label]) => <ReviewField key={key} label={label} value={entry.measurements[key]} />)}
            <ReviewField label="Other comments" value={entry.otherComments} />
          </dl>
        </section>
      ) : (
        <section className="review-section" aria-labelledby="review-vascular-title">
          <h3 id="review-vascular-title">Vascular access procedure</h3>
          <dl className="review-fields">
            <ReviewField label="Procedure category" value={VASCULAR_PROCEDURES.find(([key]) => key === entry.procedureCategory)?.[1] ?? entry.procedureCategory} />
            <ReviewField label="Procedure" value={entry.procedure} />
            <ReviewField label="Site of insertion" value={entry.insertionSite} />
            <ReviewField label="Type of line" value={entry.lineType} />
            <ReviewField label="PICC/midline quota substitution" value={entry.piccMidlineSubstitution ? "Yes, counted as an allowed substitute" : "No"} />
          </dl>
          <h3>Scan and procedure checks</h3>
          <dl className="review-fields">
            {VASCULAR_ASSESSMENTS.map(([key, label]) => <ReviewField key={key} label={label} value={ASSESSMENT_LABELS[entry.assessments[key]]} />)}
            <ReviewField label="Comments" value={entry.otherComments} />
          </dl>
        </section>
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
