import { formatCaseDate, getCaseSequenceNumbers } from "./case-display";
import { isSampleCase, PATHWAYS, type LogbookCase, type Pathway } from "./logbook";
import { getDefaultCurriculumProfile } from "./pathway-requirements";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function printableDate(date: string) {
  return formatCaseDate(date, "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function row(entry: LogbookCase | undefined, studyNumber: number) {
  if (!entry) {
    return `<tr class="empty-row"><td>${studyNumber}</td><td></td><td></td><td></td><td></td></tr>`;
  }

  const supervisor = entry.supervised
    ? entry.supervisorName.trim() || "Directly supervised"
    : "Independent";
  const sampleTag = isSampleCase(entry)
    ? '<span class="sample-tag">Sample data</span>'
    : "";

  return `<tr class="filled-row${isSampleCase(entry) ? " sample-row" : ""}">
    <td class="study-number">${studyNumber}</td>
    <td>${escapeHtml(printableDate(entry.date))}</td>
    <td>${escapeHtml(entry.diagnosis.trim() || "Not recorded")}${sampleTag}</td>
    <td class="summary-cell">${escapeHtml(entry.summary.trim() || "Not recorded")}</td>
    <td>${escapeHtml(supervisor)}</td>
  </tr>`;
}

function pageRows(pathway: Pathway, totalRows: number) {
  const suppliedLayout = pathway === "heart" ? [14, 18, 18] : [10, 12, 8];
  const continuationRows = pathway === "heart" ? 18 : 12;
  const pageCapacities = [...suppliedLayout];
  let capacity = pageCapacities.reduce((total, value) => total + value, 0);
  while (capacity < totalRows) {
    pageCapacities.push(continuationRows);
    capacity += continuationRows;
  }
  return pageCapacities;
}

export function createLogbookPrintDocument(
  cases: LogbookCase[],
  pathway: Pathway,
  operatorName = "",
) {
  const pathwayCases = cases.filter((entry) => entry.pathway === pathway);
  const sequenceNumbers = getCaseSequenceNumbers(pathwayCases);
  const casesByNumber = new Map(
    pathwayCases.map((entry) => [sequenceNumbers.get(entry.id)!, entry]),
  );
  const requirements = getDefaultCurriculumProfile(pathway);
  const totalRows = Math.max(requirements.totalScans, pathwayCases.length);
  const capacities = pageRows(pathway, totalRows);
  const pathwayLabel = PATHWAYS[pathway].label;
  const operatorLabel = operatorName.trim()
    ? ` · Operator: ${escapeHtml(operatorName.trim())}`
    : "";
  let studyNumber = 1;

  const pages = capacities.map((capacity, pageIndex) => {
    const rows = Array.from({ length: capacity }, () => {
      const currentNumber = studyNumber++;
      return row(casesByNumber.get(currentNumber), currentNumber);
    }).join("");

    return `<section class="logbook-page">
      <header class="page-heading">
        <div>
          <p class="brand">CritSono: POCUS Logbook · Personal training record</p>
          <h1>${escapeHtml(pathwayLabel)} logbook</h1>
          <p class="subtitle">Training logbook · Independent personal copy · Not an official FUSIC form${operatorLabel}</p>
        </div>
        <div class="page-reference">${pageIndex + 1} / ${capacities.length}</div>
      </header>
      <table class="logbook-table">
        <colgroup><col class="study-col"><col class="date-col"><col class="diagnosis-col"><col class="summary-col"><col class="supervisor-col"></colgroup>
        <thead><tr>
          <th scope="col">Study<br>No.</th>
          <th scope="col">Date</th>
          <th scope="col">Diagnosis</th>
          <th scope="col">Summary of main findings</th>
          <th scope="col">Supervisor</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <footer class="page-footer">
        <span>Keep this copy de-identified. Do not add patient-identifying details.</span>
        <span>Printed ${escapeHtml(new Date().toLocaleDateString("en-GB"))}</span>
      </footer>
    </section>`;
  }).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(pathwayLabel)} logbook</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; color: #111; font-family: Arial, Helvetica, sans-serif; font-size: 8pt; }
    .toolbar { display: flex; justify-content: flex-end; gap: 8px; max-width: 190mm; margin: 16px auto; }
    .toolbar button { padding: 9px 14px; border: 0; border-radius: 6px; background: #17675d; color: white; font-size: 10pt; font-weight: 700; cursor: pointer; }
    .logbook-page { width: 190mm; min-height: 277mm; margin: 0 auto 10mm; padding: 0; break-after: page; position: relative; }
    .logbook-page:last-child { break-after: auto; }
    .page-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 8mm; margin: 0 0 5mm; }
    .brand { margin: 0 0 1.5mm; color: #53625a; font-size: 7pt; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; }
    h1 { margin: 0; font-size: 15pt; }
    .subtitle { margin: 1mm 0 0; color: #53625a; font-size: 7pt; }
    .page-reference { color: #53625a; font-size: 8pt; font-weight: 700; white-space: nowrap; }
    .logbook-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .logbook-table th, .logbook-table td { border: .3mm solid #202020; padding: 1.3mm 1.5mm; vertical-align: top; overflow-wrap: anywhere; }
    .logbook-table thead { display: table-header-group; }
    .logbook-table th { height: 10mm; background: #d9d9d9; font-size: 7pt; text-align: center; }
    .logbook-table tbody tr { height: 10.5mm; }
    .logbook-table td { font-size: 7pt; line-height: 1.25; }
    .study-col { width: 6%; }
    .date-col { width: 10%; }
    .diagnosis-col { width: 20%; }
    .summary-col { width: 50%; }
    .supervisor-col { width: 14%; }
    .study-number { white-space: nowrap; }
    .summary-cell { white-space: pre-wrap; }
    .empty-row td:not(:first-child) { color: transparent; }
    .sample-tag { display: inline-block; margin-top: 1mm; color: #415a8b; font-size: 5.5pt; font-weight: 700; white-space: nowrap; }
    .sample-row { background: #f4f6fc; }
    .page-footer { display: flex; justify-content: space-between; gap: 6mm; margin-top: 3mm; padding-top: 1.5mm; border-top: .25mm solid #666; color: #454545; font-size: 6pt; }
    @page { size: A4 portrait; margin: 10mm; }
    @media print {
      .toolbar { display: none; }
      .logbook-page { width: 190mm; min-height: 0; margin: 0; padding: 0; }
      .logbook-page:last-child { break-after: auto; }
    }
    @media screen {
      body { padding: 1px; background: #e9ece9; }
      .logbook-page { width: min(190mm, calc(100vw - 24px)); margin: 0 auto 10mm; padding: 8mm; background: #fff; box-shadow: 0 2px 12px #0002; }
    }
  </style>
</head>
<body>
  <div class="toolbar"><button onclick="window.print()">Print / save PDF</button></div>
  <main>${pages}</main>
</body>
</html>`;
}
