import type { LungCaseFields } from "./logbook";

function escapePrintText(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function text(value: string, x: number, y: number, size = 18) {
  const content = value.trim();
  if (!content) return "";
  return `<text x="${x}" y="${y}" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="${size}" fill="#111">${escapePrintText(content)}</text>`;
}

function wrappedText(value: string, x: number, y: number, maxCharacters: number, maxLines: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxCharacters && line) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines).map((item, index) => text(item, x, y + index * 24, 17)).join("");
}

function roundedMark(x: number, y: number, width = 34, height = 34) {
  return `<rect x="${x - width / 2}" y="${y - height / 2}" width="${width}" height="${height}" rx="6" fill="none" stroke="#111" stroke-width="2.5"/>`;
}

const regions = [
  ["Right upper anterior", 815],
  ["Right lower anterior", 888],
  ["Right posterolateral", 961],
  ["Left upper anterior", 1100],
  ["Left lower anterior", 1174],
  ["Left posterolateral", 1246],
] as const;
const findings = ["lungSliding", "bLines", "consolidation", "pleuralEffusion"] as const;
const responseCenters = [[333, 402], [476, 557], [642, 732], [815, 888]] as const;

export function createLungIcsFormPrintDocument(entry: LungCaseFields, operatorName = "") {
  const fields: string[] = [];
  const demographics = [
    entry.patientAge.trim() && `Age ${entry.patientAge.trim()}`,
    entry.patientGender.trim(),
    entry.patientBmi.trim() && `BMI ${entry.patientBmi.trim()}`,
  ].filter(Boolean).join(" · ");
  fields.push(wrappedText(demographics, 365, 306, 30, 2));
  fields.push(wrappedText(operatorName, 725, 306, 32, 2));
  fields.push(wrappedText(entry.indication, 365, 385, 76, 2));

  const ventilatoryCenters: Record<string, [number, number]> = {
    None: [422, 64], IPPV: [534, 64], "PSV / spontaneous": [653, 100], "PSV/SPONT": [653, 100],
    BiPAP: [791, 76], BIPAP: [791, 76], "CPAP / NHF": [968, 116], "CPAP/NHF": [968, 116],
  };
  const ventilation = ventilatoryCenters[entry.ventilatorySupport.trim()];
  if (ventilation) fields.push(roundedMark(ventilation[0], 454, ventilation[1]));

  const qualityMarks = { good: [474, 78], acceptable: [721, 120], poor: [968, 78] } as const;
  if (entry.imageQuality in qualityMarks) {
    const [x, width] = qualityMarks[entry.imageQuality as keyof typeof qualityMarks];
    fields.push(roundedMark(x, 525, width));
  }

  for (const [region, y] of regions) {
    const responses = entry.findings[region];
    findings.forEach((finding, index) => {
      const value = responses[finding];
      if (value === "yes" || value === "no") fields.push(roundedMark(responseCenters[index][value === "yes" ? 0 : 1], y, 58));
    });
  }

  const comments = [entry.diagnosis.trim() && `Diagnosis: ${entry.diagnosis.trim()}`, entry.summary.trim()]
    .filter(Boolean).join("\n");
  fields.push(wrappedText(comments, 300, 1320, 68, 5));

  const base = import.meta.env.BASE_URL;
  const templateUrl = `${base}templates/fusic-lung-report-form-v10.svg`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Lung case report form · ${escapePrintText(entry.date)}</title>
<style>
  * { box-sizing: border-box; } body { margin: 0; color: #111; font-family: Arial, Helvetica, sans-serif; }
  .toolbar { width: min(210mm, calc(100vw - 24px)); margin: 16px auto; }
  .toolbar button { padding: 9px 14px; border: 0; border-radius: 6px; background: #17675d; color: white; font-size: 10pt; font-weight: 700; cursor: pointer; }
  .preview-note { width: min(210mm, calc(100vw - 24px)); margin: 0 auto 12px; color: #53625a; font-size: 12px; line-height: 1.45; }
  .ics-form-sheet { position: relative; width: 210mm; height: 297mm; margin: 0 auto 16px; overflow: hidden; background: white; }
  .ics-form-background, .ics-form-overlay { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
  .ics-form-background { object-fit: fill; } .ics-form-overlay { pointer-events: none; }
  @page { size: A4 portrait; margin: 0; }
  @media print { .toolbar, .preview-note { display: none; } .ics-form-sheet { margin: 0; break-after: page; page-break-after: always; } .ics-form-sheet:last-child { break-after: auto; page-break-after: auto; } }
  @media screen { body { padding: 1px; background: #e9ece9; } .ics-form-sheet { width: min(210mm, calc(100vw - 24px)); height: auto; aspect-ratio: 210 / 297; box-shadow: 0 2px 12px #0002; } }
</style></head><body>
<div class="toolbar"><button onclick="window.print()">Print / save PDF</button></div>
<p class="preview-note">Prefilled from this CritSono Lung case using the ICS Lung report-form layout (Assessment Pack 2025 v10). Demographics and operator appear when recorded; unsupported findings and unrecorded fields remain blank for completion by hand.</p>
<main class="ics-form-sheet"><img class="ics-form-background" src="${templateUrl}" alt=""><svg class="ics-form-overlay" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1192 1684" preserveAspectRatio="none" aria-hidden="true">${fields.join("")}</svg></main>
</body></html>`;
}

export function createLungIcsFormsPrintDocument(entries: LungCaseFields[], operatorName = "") {
  if (entries.length === 0) throw new Error("There are no Lung cases to include in this ICS PDF.");
  const documents = entries.map((entry) => createLungIcsFormPrintDocument(entry, operatorName));
  const styles = documents[0].match(/<style>([\s\S]*?)<\/style>/)?.[1];
  const sheets = documents.map((document) => document.match(/<main class="ics-form-sheet">[\s\S]*?<\/main>/)?.[0]);
  if (!styles || sheets.some((sheet) => !sheet)) throw new Error("The ICS Lung report forms could not be prepared for printing.");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>ICS Lung logbook report forms</title><style>${styles}</style></head><body>
  <div class="toolbar"><button onclick="window.print()">Print / save PDF</button></div>
  <p class="preview-note">One ICS Lung logbook report form per saved Lung case (${entries.length} cases). Demographics and operator appear when recorded; unsupported fields remain blank for completion by hand.</p>
  <main class="ics-form-collection">${sheets.join("")}</main></body></html>`;
}
