import { getCaseSequenceNumbers } from "./case-display";
import { PATHWAYS, isSampleCase, type LogbookCase, type Pathway } from "./logbook";
import { pathwayCsvColumns, pathwayCsvValues } from "../pathways/csv";

function csvCell(value: string | number | boolean) {
  const text = String(value);
  // Prevent spreadsheet programs from interpreting case text as a formula.
  const safeText = /^[\u0000-\u0020]*[=+\-@]/.test(text) ? "'" + text : text;
  return "\"" + safeText.replaceAll("\"", "\"\"") + "\"";
}

function commonColumns() {
  return [
    "Case number", "Scan date", "Case type", "Sample data", "Directly supervised",
    "Supervisor", "Indication", "Diagnosis", "Impression", "Management impact", "Image quality",
  ];
}

export function createCasesCsv(cases: LogbookCase[], pathway: Pathway) {
  const pathwayCases = cases.filter((entry) => entry.pathway === pathway);
  const sequenceNumbers = getCaseSequenceNumbers(pathwayCases);
  const headers = [...commonColumns(), ...pathwayCsvColumns(pathway), "Summary of main findings", "Reflection"];
  const rows = pathwayCases
    .slice()
    .sort((a, b) => sequenceNumbers.get(a.id)! - sequenceNumbers.get(b.id)!)
    .map((entry) => {
      const common = [
        sequenceNumbers.get(entry.id)!,
        entry.date,
        entry.caseType === "healthy_volunteer" ? "Healthy volunteer" : "Clinical scan",
        isSampleCase(entry) ? "Yes" : "No",
        entry.supervised ? "Yes" : "No",
        entry.supervisorName.trim(),
        entry.indication.trim(),
        entry.diagnosis.trim(),
        entry.impressionCategory === "not_recorded" ? "Not recorded" : entry.impressionCategory,
        entry.managementImpact === "not_recorded" ? "Not recorded" : entry.managementImpact,
        entry.imageQuality === "not_recorded" ? "Not recorded" : entry.imageQuality,
      ];
      return [...common, ...pathwayCsvValues(entry), entry.summary.trim(), entry.reflection.trim()];
    });

  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function csvFilename(pathway: Pathway, now = new Date()) {
  const date = now.toISOString().slice(0, 10);
  return "pocus-" + PATHWAYS[pathway].label.toLowerCase() + "-logbook-" + date + ".csv";
}
