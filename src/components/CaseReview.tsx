import { isSampleCase, PATHWAYS, type LogbookCase } from "../domain/logbook";
import {
  formatCaseDate,
  formatImageQuality,
  formatImpression,
  formatManagementImpact,
  formatSupervision,
} from "../domain/case-display";
import { ReviewField } from "./review/ReviewField";
import { AbdomenReviewDetails } from "../pathways/abdomen/AbdomenReviewDetails";
import { DvtReviewDetails } from "../pathways/dvt/DvtReviewDetails";
import { HdReviewDetails } from "../pathways/hd/HdReviewDetails";
import { HeartReviewDetails } from "../pathways/heart/HeartReviewDetails";
import { LungReviewDetails } from "../pathways/lung/LungReviewDetails";
import { VascularReviewDetails } from "../pathways/vascular/VascularReviewDetails";

interface CaseReviewProps {
  entry: LogbookCase;
  caseNumber: number;
  onPrint: () => void;
  onPrintHeartIcsForm: () => void;
  onPrintLungIcsForm: () => void;
  onPrintAbdomenIcsForm: () => void;
  onEdit: () => void;
  onClose: () => void;
}

function CaseReview({ entry, caseNumber, onPrint, onPrintHeartIcsForm, onPrintLungIcsForm, onPrintAbdomenIcsForm, onEdit, onClose }: CaseReviewProps) {
  const caseType = entry.caseType === "healthy_volunteer" ? "Healthy volunteer" : "Clinical scan";

  return (
    <section className="case-review" aria-labelledby="review-title">
      <header className="case-review-heading">
        <div>
          <p className="eyebrow">{PATHWAYS[entry.pathway].label} · Case review{isSampleCase(entry) && " · Sample data"}</p>
          <h2 id="review-title">{PATHWAYS[entry.pathway].label} Case {caseNumber}</h2>
          <p className="case-review-date">{formatCaseDate(entry.date, "en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
          {entry.diagnosis && <p className="case-review-diagnosis">{entry.diagnosis}</p>}
        </div>
        <div className="case-review-actions">
          <button className="button button-secondary" type="button" onClick={onPrint}>PDF</button>
          {entry.pathway === "heart" && <button className="button button-secondary" type="button" onClick={onPrintHeartIcsForm}>ICS PDF</button>}
          {entry.pathway === "lung" && <button className="button button-secondary" type="button" onClick={onPrintLungIcsForm}>ICS PDF</button>}
          {entry.pathway === "abdomen" && <button className="button button-secondary" type="button" onClick={onPrintAbdomenIcsForm}>ICS PDF</button>}
          <button className="button button-secondary" type="button" onClick={onClose}>Back to cases</button>
          <button className="button button-primary" type="button" onClick={onEdit}>Edit case</button>
        </div>
      </header>

      <section className="review-section" aria-labelledby="review-details-title">
        <h3 id="review-details-title">Case context and review markers</h3>
        <dl className="review-fields">
          <ReviewField label="Case type" value={caseType} />
          <ReviewField label="Indication" value={entry.indication} />
          <ReviewField label="Diagnosis / impression" value={entry.diagnosis} />
          <ReviewField label="Supervision" value={formatSupervision(entry)} />
          <ReviewField label="Impression category" value={formatImpression(entry.impressionCategory)} />
          <ReviewField label="Management impact" value={formatManagementImpact(entry.managementImpact)} />
          <ReviewField label="Image quality" value={formatImageQuality(entry.imageQuality)} />
        </dl>
      </section>

      {entry.pathway === "lung" ? <LungReviewDetails entry={entry} />
        : entry.pathway === "heart" ? <HeartReviewDetails entry={entry} />
          : entry.pathway === "abdomen" ? <AbdomenReviewDetails entry={entry} />
            : entry.pathway === "dvt" ? <DvtReviewDetails entry={entry} />
              : entry.pathway === "hd" ? <HdReviewDetails entry={entry} />
                : <VascularReviewDetails entry={entry} />}

      <section className="review-section" aria-labelledby="review-notes-title">
        <h3 id="review-notes-title">Notes and reflection</h3>
        <dl className="review-notes">
          <ReviewField label="Summary of findings" value={entry.summary} />
          <ReviewField label="Reflection / points to review" value={entry.reflection} />
        </dl>
      </section>
    </section>
  );
}

export default CaseReview;
