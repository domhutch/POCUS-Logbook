import { LUNG_FINDINGS, LUNG_REGIONS, type LogbookCase } from "../../domain/logbook";
import { formatImageQuality } from "../../domain/case-display";
import { assessmentChoices, escapeHtml, field } from "../../domain/case-print-format";
type Entry = Extract<LogbookCase, { pathway: "lung" }>;
export function lungPrintDetails(entry: Entry) {
  const rows = LUNG_REGIONS.map((region) => {
    const attempted = entry.regions.includes(region);
    const findings = LUNG_FINDINGS.map(([key]) => "<td>" + assessmentChoices(entry.findings[region][key]) + "</td>").join("");
    return '<tr><th scope="row"><span class="checkbox ' + (attempted ? "checked" : "") + '"></span>' + escapeHtml(region) + "</th>" + findings + "</tr>";
  }).join("");
  return '<section class="section"><h2>Demographics</h2><div class="field-grid">' + field("Age (years)", entry.patientAge) + field("Gender", entry.patientGender) + field("BMI", entry.patientBmi) + '</div><h2>Scan conditions</h2><div class="field-grid">' + field("Ventilatory support", entry.ventilatorySupport) + field("Image quality", entry.imageQuality === "not_recorded" ? "" : formatImageQuality(entry.imageQuality)) + '</div><h2>Regional findings</h2><table class="report-table lung-table"><thead><tr><th scope="col">Probe position</th>' + LUNG_FINDINGS.map(([, label]) => "<th scope=\"col\">" + escapeHtml(label) + "</th>").join("") + "</tr></thead><tbody>" + rows + "</tbody></table></section>";
}
