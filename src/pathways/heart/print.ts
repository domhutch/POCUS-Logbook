import { HEART_FINDINGS, type LogbookCase } from "../../domain/logbook";
import { formatImageQuality } from "../../domain/case-display";
import { escapeHtml, field } from "../../domain/case-print-format";
type Entry = Extract<LogbookCase, { pathway: "heart" }>;
export function heartPrintDetails(entry: Entry) {
  const views = entry.views.map((view) => '<span class="view-item"><span class="checkbox checked"></span>' + escapeHtml(view) + "</span>").join("") || '<span class="not-recorded">No views recorded</span>';
  const findings = HEART_FINDINGS.map(([key, label]) => {
    const value = entry.findings[key];
    const options = [["yes", "Yes"], ["no", "No"], ["unable", "U/A"]] as const;
    return '<tr><th scope="row">' + escapeHtml(label) + "</th>" + options.map(([option, text]) => '<td class="choice-cell">' + (value === option ? '<strong class="selected">' + text + "</strong>" : "") + "</td>").join("") + "</tr>";
  }).join("");
  return '<section class="section"><h2>Demographics</h2><div class="field-grid">' + field("Age (years)", entry.patientAge) + field("Gender", entry.patientGender) + field("BMI", entry.patientBmi) + '</div><h2>Scan conditions</h2><div class="field-grid">' + field("Ventilatory support", entry.ventilatorySupport) + field("Cardiovascular support", entry.cardiovascularSupport) + field("Heart rate", entry.heartRate) + field("Blood pressure", entry.bloodPressure) + field("Central venous pressure", entry.centralVenousPressure) + field("Image quality", entry.imageQuality === "not_recorded" ? "" : formatImageQuality(entry.imageQuality)) + '</div><h2>Views obtained</h2><div class="view-list">' + views + '</div><h2>Assessment findings</h2><table class="report-table heart-table"><thead><tr><th scope="col">Finding</th><th scope="col">Yes</th><th scope="col">No</th><th scope="col">U/A</th></tr></thead><tbody>' + findings + '</tbody></table><p class="table-legend">Selected responses are outlined; blank responses are not assessed. U/A = unable to assess.</p></section>';
}
