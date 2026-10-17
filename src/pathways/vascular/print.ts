import { VASCULAR_ASSESSMENTS, VASCULAR_PROCEDURES, type LogbookCase } from "../../domain/logbook";
import { formatImageQuality } from "../../domain/case-display";
import { assessmentChoices, escapeHtml, field } from "../../domain/case-print-format";
type Entry = Extract<LogbookCase, { pathway: "vascular" }>;
export function vascularPrintDetails(entry: Entry) {
  const checks = VASCULAR_ASSESSMENTS.map(([key, label]) => "<tr><th scope=\"row\">" + escapeHtml(label) + "</th><td>" + assessmentChoices(entry.assessments[key]) + "</td></tr>").join("");
  return '<section class="section"><h2>Procedure details</h2><div class="field-grid">' + field("Procedure category", VASCULAR_PROCEDURES.find(([key]) => key === entry.procedureCategory)?.[1] ?? entry.procedureCategory) + field("Procedure", entry.procedure) + field("Site of insertion", entry.insertionSite) + field("Type of line", entry.lineType) + field("PICC/midline quota substitution", entry.piccMidlineSubstitution ? "Yes, counted as an allowed substitute" : "No") + field("Image quality", entry.imageQuality === "not_recorded" ? "" : formatImageQuality(entry.imageQuality)) + '</div><h2>Scan and procedure checks</h2><table class="report-table vascular-table"><tbody>' + checks + "</tbody></table>" + field("Comments", entry.otherComments) + "</section>";
}
