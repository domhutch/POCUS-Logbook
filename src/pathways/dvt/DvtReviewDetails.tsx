import { DVT_SITE_FINDINGS, DVT_SITES, type LogbookCase } from "../../domain/logbook";
import { ASSESSMENT_LABELS } from "../../domain/case-display";
import { ReviewField } from "../../components/review/ReviewField";

type DvtCase = Extract<LogbookCase, { pathway: "dvt" }>;

export function DvtReviewDetails({ entry }: { entry: DvtCase }) {
  return (
    <section className="review-section" aria-labelledby="review-dvt-title">
      <h3 id="review-dvt-title">Venous findings</h3>
      <div className="review-region-list">
        {DVT_SITES.map((site) => (
          <section className="review-region" key={site}>
            <h4>{site}</h4>
            <dl className="review-finding-list">
              {DVT_SITE_FINDINGS.map(([key, label]) => <ReviewField key={key} label={label} value={ASSESSMENT_LABELS[entry.findings[site][key]]} />)}
            </dl>
          </section>
        ))}
      </div>
      <dl className="review-fields"><ReviewField label="Other comments" value={entry.otherComments} /></dl>
    </section>
  );
}
