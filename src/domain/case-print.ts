import { PATHWAYS, type LogbookCase } from "./logbook";
import {
  formatImpression,
  formatManagementImpact,
  formatSupervision,
} from "./case-display";
import { escapeHtml, field } from "./case-print-format";
import { pathwayPrintDetails } from "../pathways/print";

function formatUkDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export function createCasePrintDocument(entry: LogbookCase, defaultOperatorName = "") {
  const supervision = formatSupervision(entry);
  const caseType =
    entry.caseType === "healthy_volunteer" ? "Healthy volunteer" : "Clinical scan";
  const impression = entry.impressionCategory === "not_recorded"
    ? ""
    : formatImpression(entry.impressionCategory);
  const management = entry.managementImpact === "not_recorded"
    ? ""
    : formatManagementImpact(entry.managementImpact);
  const operatorName = defaultOperatorName.trim() ||
    (entry.pathway === "heart" ? entry.operatorName : "");
  const details = pathwayPrintDetails(entry);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(PATHWAYS[entry.pathway].label)} case · ${escapeHtml(entry.date)}</title>
  <style>
    :root { --print-scale: 1; --heading-one-size: 15pt; --heading-two-size: 9pt; color: #213a34; font-family: Arial, Helvetica, sans-serif; font-size: 9pt; }
    * { box-sizing: border-box; }
    body { width: 194mm; margin: 0 auto; padding: 0; }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: var(--heading-one-size); letter-spacing: -.03em; }
    h2 { margin: 2.5mm 0 1.2mm; padding-bottom: .7mm; border-bottom: .3mm solid #66746b; color: #213a34; font-size: var(--heading-two-size); }
    .toolbar { display: flex; justify-content: flex-end; margin-bottom: 8mm; }
    .print-button { padding: 9px 14px; border: 0; border-radius: 6px; background: #17675d; color: white; font-size: 10pt; font-weight: 700; cursor: pointer; }
    .sheet { width: 194mm; padding: 6mm; border: .3mm solid #79847c; background: white; }
    .sheet-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 6mm; padding-bottom: 2.5mm; border-bottom: .7mm solid #17675d; }
    .brand { margin-bottom: 1mm; color: #65716b; font-size: 7pt; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    .subtitle { margin-top: 1mm; color: #65716b; font-size: 6.5pt; }
    .badge { padding: 1mm 2mm; border: .3mm solid #66746b; font-size: 8pt; font-weight: 700; white-space: nowrap; }
    .section { margin-top: 2mm; break-inside: avoid; }
    .field-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0; border-top: .25mm solid #66746b; border-left: .25mm solid #66746b; }
    .field { min-height: 9mm; padding: 1.2mm 1.5mm; border-right: .25mm solid #66746b; border-bottom: .25mm solid #66746b; }
    .field-label { display: block; margin-bottom: .5mm; color: #435148; font-size: 6pt; font-weight: 700; }
    .field-value { display: block; min-height: 3mm; overflow-wrap: anywhere; font-size: 7.5pt; line-height: 1.2; }
    .muted, .not-recorded { color: #59665d; font-size: 6.5pt; }
    .report-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 7pt; }
    .report-table th, .report-table td { padding: 1mm 1.2mm; border: .25mm solid #66746b; vertical-align: middle; }
    .report-table thead th { background: #e9ece8; font-size: 6.5pt; font-weight: 700; text-align: center; }
    .report-table tbody th { font-weight: 700; text-align: left; }
    .lung-table th:first-child { width: 30%; }
    .lung-table td { text-align: center; }
    .checkbox { display: inline-block; width: 3mm; height: 3mm; margin-right: 1mm; border: .3mm solid #34443a; vertical-align: -.5mm; }
    .checkbox.checked { background: #34443a; box-shadow: inset 0 0 0 .5mm white; }
    .choices { display: inline-flex; justify-content: center; gap: .6mm; white-space: nowrap; }
    .choice { padding: .4mm .6mm; font-size: 5.8pt; }
    .choice.selected, .selected { border: .3mm solid #213a34; font-weight: 700; }
    .view-list { display: flex; flex-wrap: wrap; gap: 2mm 5mm; padding: 1mm 0; }
    .view-item { display: inline-flex; align-items: center; gap: 1mm; font-size: 7pt; }
    .heart-table th:first-child { width: 61%; }
    .heart-table td { width: 13%; height: 6mm; text-align: center; }
    .heart-table .selected { padding: .4mm 1mm; }
    .dvt-table { font-size: 5.8pt; }
    .dvt-table th:first-child { width: 25%; }
    .dvt-table th, .dvt-table td { padding: .7mm .4mm; text-align: center; overflow-wrap: anywhere; }
    .dvt-table tbody th { text-align: left; }
    .hd-table { font-size: 6.5pt; }
    .hd-table th:first-child { width: 35%; }
    .hd-table th:nth-child(2) { width: 19%; }
    .hd-table th, .hd-table td { padding: 1mm; vertical-align: top; overflow-wrap: anywhere; }
    .vascular-table { width: 75%; }
    .vascular-table th { width: 75%; text-align: left; }
    .vascular-table td { text-align: center; }
    .table-legend { margin-top: 1mm; color: #435148; font-size: 6pt; }
    .notes-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .notes { min-height: 13mm; padding: 1.5mm; border: .25mm solid #66746b; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 7pt; line-height: 1.25; }
    .notes-label { display: block; margin-bottom: .6mm; font-size: 6pt; font-weight: 700; }
    .notes.blank { background: repeating-linear-gradient(to bottom, white 0, white 4mm, #aab2ac 4mm, #aab2ac 4.1mm); }
    .footer { display: flex; justify-content: space-between; gap: 4mm; margin-top: 2mm; padding-top: 1mm; border-top: .25mm solid #66746b; color: #435148; font-size: 6pt; }
    @page { size: A4 portrait; margin: 8mm; }
    @media print {
      body { width: 194mm; }
      .sheet { zoom: var(--print-scale, 1); padding: 0; border: 0; }
      h1 { font-size: calc(var(--heading-one-size) / var(--print-scale, 1)); }
      h2 { font-size: calc(var(--heading-two-size) / var(--print-scale, 1)); }
      .toolbar { display: none; }
      .sheet { break-inside: avoid; }
    }
    @media screen {
      body { width: auto; margin: 12px 0; }
      .sheet { width: min(194mm, calc(100vw - 24px)); box-shadow: 0 8px 30px rgb(31 55 45 / 8%); }
    }
  </style>
</head>
<body>
  <div class="toolbar"><button class="print-button" onclick="window.print()">Print / save PDF</button></div>
  <main class="sheet">
    <header class="sheet-header">
      <div><p class="brand">CritSono: POCUS Logbook · Personal case record</p><h1>${escapeHtml(PATHWAYS[entry.pathway].label)} logbook report</h1><p class="subtitle">Training and reflection record · Not a clinical record or accreditation decision</p></div>
      <span class="badge">${escapeHtml(formatUkDate(entry.date))}</span>
    </header>
    <section class="section"><h2>Case details</h2><div class="field-grid">
      ${field("Case type", caseType)}
      ${field("Supervision", supervision)}
      ${field("Operator", operatorName)}
      ${field("Indication for scan", entry.indication)}
      ${field("Diagnosis / impression", entry.diagnosis)}
      ${field("Impression category", impression)}
      ${field("Management impact", management)}
    </div></section>
    ${details}
    <section class="section"><h2>Summary and reflection</h2><div class="notes-grid">
      <div class="notes ${entry.summary.trim() ? "" : "blank"}"><span class="notes-label">Summary of findings</span>${entry.summary.trim() ? escapeHtml(entry.summary.trim()) : ""}</div>
      <div class="notes ${entry.reflection.trim() ? "" : "blank"}"><span class="notes-label">Reflection / points to review</span>${entry.reflection.trim() ? escapeHtml(entry.reflection.trim()) : ""}</div>
    </div></section>
    <footer class="footer"><span>Keep this copy de-identified. Do not add patient-identifying details.</span><span>Printed ${escapeHtml(new Date().toLocaleDateString("en-GB"))}</span></footer>
  </main>
  <script>
    function fitPrintSheet() {
      const sheet = document.querySelector(".sheet");
      if (!sheet) return;
      document.documentElement.style.setProperty("--print-scale", "1");
      const printableHeight = 275 * 96 / 25.4;
      const scale = Math.min(1, printableHeight / sheet.offsetHeight);
      document.documentElement.style.setProperty("--print-scale", scale.toFixed(4));
    }
    fitPrintSheet();
    window.addEventListener("beforeprint", fitPrintSheet);
    window.requestAnimationFrame(fitPrintSheet);
  </script>
</body>
</html>`;
}

export function createCaseReportsPrintDocument(
  cases: LogbookCase[],
  pathway: LogbookCase["pathway"],
  operatorName = "",
) {
  const reports = cases
    .filter((entry) => entry.pathway === pathway)
    .map((entry) => createCasePrintDocument(entry, operatorName));
  return combineCaseReports(reports, `${PATHWAYS[pathway].label} case reports`);
}

export function createFullLogbookPrintDocument(cases: LogbookCase[], operatorName = "") {
  if (cases.length === 0) {
    throw new Error("There are no saved cases to include in this PDF.");
  }
  const reports = cases
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.pathway.localeCompare(b.pathway) || a.createdAt.localeCompare(b.createdAt))
    .map((entry) => createCasePrintDocument(entry, operatorName));
  return combineCaseReports(reports, "Full CritSono logbook");
}

function combineCaseReports(reports: string[], title: string) {
  if (reports.length === 0) {
    throw new Error("There are no saved cases to include in this PDF.");
  }

  const styles = reports[0].match(/<style>([\s\S]*?)<\/style>/)?.[1];
  const sheets = reports.map((report) =>
    report.match(/<main class="sheet">[\s\S]*?<\/main>/)?.[0],
  );
  if (!styles || sheets.some((sheet) => !sheet)) {
    throw new Error("The case reports could not be prepared for printing.");
  }

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>${styles}
    @media print { body { width: 194mm; } }
    .report-collection .sheet { margin: 0 auto; break-after: page; page-break-after: always; }
    .report-collection .sheet:last-child { break-after: auto; page-break-after: auto; }
    @media screen {
      body { width: auto; margin: 12px 0; }
      .report-collection .sheet { width: min(194mm, calc(100vw - 24px)); margin: 0 auto 24px; }
    }
  </style>
</head>
<body><main class="report-collection">${sheets.join("")}</main>
<script>
  function fitReportSheets() {
    const printableHeight = 275 * 96 / 25.4;
    document.querySelectorAll(".report-collection .sheet").forEach((sheet) => {
      sheet.style.setProperty("--print-scale", "1");
      const scale = Math.min(1, printableHeight / sheet.offsetHeight);
      sheet.style.setProperty("--print-scale", scale.toFixed(4));
    });
  }
  fitReportSheets();
  window.addEventListener("beforeprint", fitReportSheets);
  window.requestAnimationFrame(fitReportSheets);
</script>
</body>
</html>`;
}
