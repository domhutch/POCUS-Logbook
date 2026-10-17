import { HD_MEASUREMENTS, HD_QUESTIONS, type LogbookCase } from "../../domain/logbook";
import { ASSESSMENT_LABELS } from "../../domain/case-display";
import { ReviewField } from "../../components/review/ReviewField";

type HdCase = Extract<LogbookCase, { pathway: "hd" }>;

export function HdReviewDetails({ entry }: { entry: HdCase }) {
  return (
    <section className="review-section" aria-labelledby="review-hd-title">
      <h3 id="review-hd-title">FUSIC HD clinical questions</h3>
      <dl className="review-finding-list review-heart-findings">
        {HD_QUESTIONS.map(([key, question]) => <ReviewField key={key} label={question} value={`${ASSESSMENT_LABELS[entry.questionFindings[key]]}${entry.questionNotes[key] ? ` · ${entry.questionNotes[key]}` : ""}`} />)}
      </dl>
      <h3>Measurements and Doppler</h3>
      <dl className="review-fields">
        {HD_MEASUREMENTS.map(([key, label]) => <ReviewField key={key} label={label} value={entry.measurements[key]} />)}
        <ReviewField label="Other comments" value={entry.otherComments} />
      </dl>
    </section>
  );
}
