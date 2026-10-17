import { VASCULAR_ASSESSMENTS, VASCULAR_PROCEDURES, type LogbookCase } from "../../domain/logbook";
import { ASSESSMENT_LABELS } from "../../domain/case-display";
import { ReviewField } from "../../components/review/ReviewField";

type VascularCase = Extract<LogbookCase, { pathway: "vascular" }>;

export function VascularReviewDetails({ entry }: { entry: VascularCase }) {
  return (
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
  );
}
