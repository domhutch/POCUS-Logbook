import { DVT_SITE_FINDINGS, DVT_SITES, type LogbookCase } from "../../domain/logbook";
import { formatImageQuality } from "../../domain/case-display";
import { assessmentChoices, escapeHtml, field } from "../../domain/case-print-format";
type Entry = Extract<LogbookCase, { pathway: "dvt" }>;
export function dvtPrintDetails(entry: Entry) {
  const rows = DVT_SITES.map((site) => "<tr><th scope=\"row\">" + escapeHtml(site) + "</th>" + DVT_SITE_FINDINGS.map(([key]) => "<td>" + assessmentChoices(entry.findings[site][key]) + "</td>").join("") + "</tr>").join("");
  return '<section class="section"><h2>Image quality</h2><div class="field-grid">' + field("Image quality", formatImageQuality(entry.imageQuality)) + '</div><h2>Venous findings</h2><table class="report-table dvt-table"><thead><tr><th scope="col">Examination site</th>' + DVT_SITE_FINDINGS.map(([, label]) => "<th scope=\"col\">" + escapeHtml(label) + "</th>").join("") + "</tr></thead><tbody>" + rows + '</tbody></table><p class="table-legend">Not assessed fields are left blank. U/A = unable to assess.</p>' + field("Other comments", entry.otherComments) + "</section>";
}
