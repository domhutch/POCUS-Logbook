import { LUNG_FINDINGS, LUNG_REGIONS, type LogbookCase } from "../../domain/logbook";
import { ASSESSMENT_LABELS } from "../../domain/case-display";
import { ReviewField } from "../../components/review/ReviewField";

type LungCase = Extract<LogbookCase, { pathway: "lung" }>;

export function LungReviewDetails({ entry }: { entry: LungCase }) {
  return (
    <>
      <section className="review-section" aria-labelledby="review-context-lung-title">
        <h3 id="review-context-lung-title">Patient and scan context</h3>
        <dl className="review-fields">
          <ReviewField label="Age (years)" value={entry.patientAge} />
          <ReviewField label="Gender" value={entry.patientGender} />
          <ReviewField label="BMI" value={entry.patientBmi} />
          <ReviewField label="Ventilatory support" value={entry.ventilatorySupport} />
        </dl>
      </section>
      <section className="review-section" aria-labelledby="review-scan-title">
        <h3 id="review-scan-title">Lung regions and findings</h3>
        <div className="review-region-list">
          {LUNG_REGIONS.map((region) => (
            <section className="review-region" key={region}>
              <h4>{region}<span>{entry.regions.includes(region) ? "Recorded" : "Not recorded"}</span></h4>
              <dl className="review-finding-list">
                {LUNG_FINDINGS.map(([key, label]) => <ReviewField key={key} label={label} value={ASSESSMENT_LABELS[entry.findings[region][key]]} />)}
              </dl>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
