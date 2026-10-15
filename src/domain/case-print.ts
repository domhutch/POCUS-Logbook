import {
  HEART_FINDINGS,
  LUNG_FINDINGS,
  LUNG_REGIONS,
  PATHWAYS,
  type Assessment,
  type LogbookCase,
} from "./logbook";

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

function displayValue(value: string) {
  return value.trim() ? escapeHtml(value.trim()) : '<span class="muted">Not recorded</span>';
}

function displayLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) =>
    character.toUpperCase(),
  );
}

function displayAssessment(value: Assessment) {
  return {
    not_assessed: "Not assessed",
    yes: "Yes",
    no: "No",
    unable: "Unable to assess",
  }[value];
}

function field(label: string, value: string) {
  return `<div class="field"><span class="field-label">${escapeHtml(label)}</span><span class="field-value">${displayValue(value)}</span></div>`;
}

function lungDetails(entry: Extract<LogbookCase, { pathway: "lung" }>) {
  const rows = LUNG_REGIONS.map((region) => {
    const attempted = entry.regions.includes(region);
    const findings = LUNG_FINDINGS.map(
      ([key, label]) =>
        `<div class="finding"><span>${escapeHtml(label)}</span><strong>${escapeHtml(displayAssessment(entry.findings[region][key]))}</strong></div>`,
    ).join("");
    return `<section class="region-row"><div class="region-title"><span class="checkbox ${attempted ? "checked" : ""}"></span><strong>${escapeHtml(region)}</strong><small>${attempted ? "Attempted" : "Not attempted"}</small></div><div class="findings">${findings}</div></section>`;
  }).join("");

  return `<section class="section"><h2>Regional scan record</h2><div class="field-grid">${field("Ventilatory support", entry.ventilatorySupport)}${field("Image quality", entry.imageQuality === "not_recorded" ? "" : displayLabel(entry.imageQuality))}</div>${rows}</section>`;
}

function heartDetails(entry: Extract<LogbookCase, { pathway: "heart" }>) {
  const views = entry.views
    .map(
      (view) =>
        `<span class="view-item"><span class="checkbox checked"></span>${escapeHtml(view)}</span>`,
    )
    .join("");
  const findings = HEART_FINDINGS.map(
    ([key, label]) =>
      `<div class="finding heart-finding"><span>${escapeHtml(label)}</span><strong>${escapeHtml(displayAssessment(entry.findings[key]))}</strong></div>`,
  ).join("");

  return `<section class="section"><h2>Focused cardiac scan record</h2><div class="field-grid">${field("Ventilatory support", entry.ventilatorySupport)}${field("Cardiovascular support", entry.cardiovascularSupport)}${field("Heart rate", entry.heartRate)}${field("Blood pressure", entry.bloodPressure)}${field("Central venous pressure", entry.centralVenousPressure)}${field("Image quality", entry.imageQuality === "not_recorded" ? "" : displayLabel(entry.imageQuality))}</div><h3>Views obtained</h3><div class="view-list">${views || '<span class="muted">No views recorded</span>'}</div><h3>Assessment findings</h3><div class="heart-findings">${findings}</div></section>`;
}

export function createCasePrintDocument(entry: LogbookCase) {
  const supervision = entry.supervised
    ? `Directly supervised${entry.supervisorName.trim() ? ` · ${entry.supervisorName.trim()}` : ""}`
    : "Not directly supervised";
  const caseType =
    entry.caseType === "healthy_volunteer" ? "Healthy volunteer" : "Clinical scan";
  const impression =
    entry.impressionCategory === "not_recorded"
      ? ""
      : entry.impressionCategory === "abnormal"
        ? "Abnormal / pathology"
        : entry.impressionCategory[0].toUpperCase() +
          entry.impressionCategory.slice(1);
  const management =
    entry.managementImpact === "not_recorded"
      ? ""
      : entry.managementImpact === "changed"
        ? "Changed"
        : "Unchanged";
  const details =
    entry.pathway === "lung" ? lungDetails(entry) : heartDetails(entry);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(PATHWAYS[entry.pathway].label)} case · ${escapeHtml(entry.date)}</title>
  <style>
    :root { color: #213a34; font-family: Arial, Helvetica, sans-serif; font-size: 10pt; }
    * { box-sizing: border-box; }
    body { max-width: 190mm; margin: 0 auto; padding: 12mm; }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: 20pt; letter-spacing: -.04em; }
    h2 { margin-bottom: 3mm; color: #17675d; font-size: 12pt; }
    h3 { margin: 4mm 0 2mm; color: #3d5c50; font-size: 9pt; }
    .toolbar { display: flex; justify-content: flex-end; margin-bottom: 8mm; }
    .print-button { padding: 9px 14px; border: 0; border-radius: 6px; background: #17675d; color: white; font-size: 10pt; font-weight: 700; cursor: pointer; }
    .sheet-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8mm; padding-bottom: 5mm; border-bottom: 2px solid #17675d; }
    .brand { margin-bottom: 2mm; color: #65716b; font-size: 8pt; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    .subtitle { margin-top: 2mm; color: #65716b; font-size: 8pt; }
    .badge { padding: 2mm 3mm; border-radius: 4px; background: #e6f1ed; color: #124d46; font-size: 9pt; font-weight: 700; white-space: nowrap; }
    .section { margin-top: 6mm; break-inside: avoid; }
    .field-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 3mm; }
    .field { min-height: 13mm; padding: 2mm; border: 1px solid #dce5dd; border-radius: 3px; }
    .field-label { display: block; margin-bottom: 1.5mm; color: #65716b; font-size: 7pt; font-weight: 700; text-transform: uppercase; }
    .field-value { display: block; min-height: 4mm; overflow-wrap: anywhere; font-size: 9pt; }
    .muted { color: #89948b; }
    .region-row { padding: 2.5mm 0; border-bottom: 1px solid #dce5dd; break-inside: avoid; }
    .region-title { display: flex; align-items: center; gap: 2mm; margin-bottom: 2mm; }
    .region-title strong { font-size: 8.5pt; }
    .region-title small { margin-left: auto; color: #65716b; font-size: 7pt; }
    .checkbox { display: inline-block; width: 3.5mm; height: 3.5mm; flex: 0 0 auto; border: 1px solid #89948b; vertical-align: middle; }
    .checkbox.checked { border-color: #17675d; background: #17675d; box-shadow: inset 0 0 0 1px white; }
    .findings { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 2mm; padding-left: 5.5mm; }
    .finding { display: flex; min-height: 8mm; flex-direction: column; justify-content: space-between; gap: 1mm; padding: 1.5mm; border: 1px solid #edf0ec; border-radius: 2px; }
    .finding span { color: #65716b; font-size: 7pt; }
    .finding strong { font-size: 8pt; font-weight: 600; }
    .view-list { display: flex; flex-wrap: wrap; gap: 2mm 5mm; }
    .view-item { display: inline-flex; align-items: center; gap: 1.5mm; font-size: 8pt; }
    .heart-findings { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2mm; }
    .heart-finding { min-height: 10mm; flex-direction: row; align-items: center; }
    .notes { min-height: 23mm; margin-top: 2mm; padding: 2mm; border: 1px solid #dce5dd; border-radius: 3px; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.45; }
    .notes.blank { background: repeating-linear-gradient(to bottom, white 0, white 6mm, #dce5dd 6mm, #dce5dd 6.2mm); }
    .footer { display: flex; justify-content: space-between; gap: 8mm; margin-top: 7mm; padding-top: 3mm; border-top: 1px solid #dce5dd; color: #65716b; font-size: 7pt; }
    @page { size: A4 portrait; margin: 0; }
    @media print {
      body { max-width: none; padding: 0; }
      .toolbar { display: none; }
      .section, .region-row { break-inside: avoid; }
    }
    @media screen {
      body { margin-top: 24px; margin-bottom: 24px; border: 1px solid #e4e9e3; box-shadow: 0 8px 30px rgb(31 55 45 / 8%); }
    }
  </style>
</head>
<body>
  <div class="toolbar"><button class="print-button" onclick="window.print()">Print / save PDF</button></div>
  <header class="sheet-header">
    <div><p class="brand">POCUS Logbook · Personal case record</p><h1>${escapeHtml(PATHWAYS[entry.pathway].label)}</h1><p class="subtitle">Personal training and reflection record · Not a clinical record or accreditation decision</p></div>
    <span class="badge">${escapeHtml(entry.date)}</span>
  </header>
  <section class="section"><h2>Case details</h2><div class="field-grid">
    ${field("Case type", caseType)}
    ${field("Indication", entry.indication)}
    ${field("Diagnosis / impression", entry.diagnosis)}
    ${field("Supervision", supervision)}
    ${field("Impression category", impression)}
    ${field("Management impact", management)}
  </div></section>
  ${details}
  <section class="section"><h2>Summary of findings</h2><div class="notes ${entry.summary.trim() ? "" : "blank"}">${entry.summary.trim() ? escapeHtml(entry.summary.trim()) : ""}</div></section>
  <section class="section"><h2>Reflection / points to review</h2><div class="notes ${entry.reflection.trim() ? "" : "blank"}">${entry.reflection.trim() ? escapeHtml(entry.reflection.trim()) : ""}</div></section>
  <footer class="footer"><span>Keep this copy de-identified. Do not add patient-identifying details.</span><span>Printed ${escapeHtml(new Date().toLocaleDateString())}</span></footer>
</body>
</html>`;
}
