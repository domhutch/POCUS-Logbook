import type { LogbookCase } from "../../domain/logbook";
import { ReviewField } from "../../components/review/ReviewField";

type AbdomenCase = Extract<LogbookCase, { pathway: "abdomen" }>;

export function AbdomenReviewDetails({ entry }: { entry: AbdomenCase }) {
  return (
    <section className="review-section" aria-labelledby="review-abdomen-title">
      <h3 id="review-abdomen-title">Abdominal findings</h3>
      {entry.examinationPoints.length > 0 && <div className="review-chip-list">{entry.examinationPoints.map((point) => <span key={point}>{point}</span>)}</div>}
      <dl className="review-fields">
        <ReviewField label="Age (years)" value={entry.patientAge} />
        <ReviewField label="Gender" value={entry.patientGender} />
        <ReviewField label="BMI" value={entry.patientBmi} />
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
  );
}
