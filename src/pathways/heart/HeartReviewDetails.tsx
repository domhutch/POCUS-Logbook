import { HEART_FINDINGS, type LogbookCase } from "../../domain/logbook";
import { ASSESSMENT_LABELS } from "../../domain/case-display";
import { ReviewField } from "../../components/review/ReviewField";

type HeartCase = Extract<LogbookCase, { pathway: "heart" }>;

export function HeartReviewDetails({ entry }: { entry: HeartCase }) {
  return (
    <>
      <section className="review-section" aria-labelledby="review-context-heart-title">
        <h3 id="review-context-heart-title">Patient and scan context</h3>
        <dl className="review-fields">
          <ReviewField label="Age (years)" value={entry.patientAge} />
          <ReviewField label="Gender" value={entry.patientGender} />
          <ReviewField label="BMI" value={entry.patientBmi} />
          <ReviewField label="Operator" value={entry.operatorName} />
          <ReviewField label="Ventilatory support" value={entry.ventilatorySupport} />
          <ReviewField label="Cardiovascular support" value={entry.cardiovascularSupport} />
          <ReviewField label="Heart rate" value={entry.heartRate} />
          <ReviewField label="Blood pressure" value={entry.bloodPressure} />
          <ReviewField label="Central venous pressure" value={entry.centralVenousPressure} />
        </dl>
      </section>
      <section className="review-section" aria-labelledby="review-views-title">
        <h3 id="review-views-title">Views obtained</h3>
        {entry.views.length ? <ul className="review-chip-list">{entry.views.map((view) => <li key={view}>{view}</li>)}</ul> : <p className="review-empty">No views recorded</p>}
      </section>
      <section className="review-section" aria-labelledby="review-findings-title">
        <h3 id="review-findings-title">Assessment findings</h3>
        <dl className="review-finding-list review-heart-findings">
          {HEART_FINDINGS.map(([key, label]) => <ReviewField key={key} label={label} value={ASSESSMENT_LABELS[entry.findings[key]]} />)}
        </dl>
      </section>
    </>
  );
}
