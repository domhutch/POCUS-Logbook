import { HD_MEASUREMENTS, HD_QUESTIONS, type LogbookCase } from "../../domain/logbook";
import { ASSESSMENT_LABELS } from "../../domain/case-display";
import { displayValue, escapeHtml, field } from "../../domain/case-print-format";
type Entry = Extract<LogbookCase, { pathway: "hd" }>;
export function hdPrintDetails(entry: Entry) {
  const questionRows = HD_QUESTIONS.map(([key, question]) => "<tr><th scope=\"row\">" + escapeHtml(question) + "</th><td>" + escapeHtml(ASSESSMENT_LABELS[entry.questionFindings[key]]) + "</td><td>" + displayValue(entry.questionNotes[key]) + "</td></tr>").join("");
  const measurements = HD_MEASUREMENTS.map(([key, label]) => field(label, entry.measurements[key])).join("");
  return '<section class="section"><h2>FUSIC HD clinical questions</h2><table class="report-table hd-table"><thead><tr><th scope="col">Question</th><th scope="col">Finding</th><th scope="col">Notes</th></tr></thead><tbody>' + questionRows + '</tbody></table><h2>Measurements and Doppler</h2><div class="field-grid">' + measurements + "</div>" + field("Other comments", entry.otherComments) + "</section>";
}
