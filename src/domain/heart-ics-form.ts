import type { HeartCaseFields } from "./logbook";

function escapePrintText(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

function text(value: string, x: number, y: number, options: { size?: number; anchor?: "start" | "middle" | "end" } = {}) {
  const content = value.trim();
  if (!content) return "";
  const anchor = options.anchor ?? "start";
  const size = options.size ?? 19;
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="${size}" fill="#111">${escapePrintText(content)}</text>`;
}

function wrappedText(value: string, x: number, y: number, maxCharacters: number, maxLines: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxCharacters && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines).map((item, index) => text(item, x, y + index * 25, { size: 17 })).join("");
}

function roundedMark(x: number, y: number, width = 32, height = 32) {
  return `<rect x="${x - width / 2}" y="${y - height / 2}" width="${width}" height="${height}" rx="6" fill="none" stroke="#111" stroke-width="2.5"/>`;
}

const assessmentRows = [
  ["lvDilated", 810],
  ["lvSignificantlyImpaired", 859],
  ["rvDilated", 907],
  ["rvSignificantlyImpaired", 955],
  ["lowPreload", 1003],
  ["pericardialFluid", 1050],
  ["pleuralFluid", 1097],
] as const;

export function createHeartIcsFormPrintDocument(entry: HeartCaseFields) {
  const fields: string[] = [];
  const demographics = [
    entry.patientAge.trim() && `Age ${entry.patientAge.trim()}`,
    entry.patientGender.trim(),
    entry.patientBmi.trim() && `BMI ${entry.patientBmi.trim()}`,
  ].filter(Boolean).join(" · ");
  fields.push(wrappedText(demographics, 366, 350, 29, 2));
  fields.push(wrappedText(entry.operatorName, 849, 350, 27, 2));
  fields.push(wrappedText(entry.indication, 371, 410, 76, 2));
  fields.push(text(entry.heartRate, 442, 516, { size: 18 }));
  fields.push(text(entry.bloodPressure, 688, 516, { size: 18 }));
  fields.push(text(entry.centralVenousPressure, 925, 516, { size: 18 }));
  fields.push(text(entry.cardiovascularSupport, 371, 563, { size: 18 }));

  if (entry.ventilatorySupport === "IPPV") fields.push(roundedMark(477, 467, 82, 34));

  const viewCenters: Record<string, number> = {
    PLAX: 417,
    PSAX: 538,
    "Apical 4-chamber": 654,
    "Subcostal 4-chamber": 774,
    IVC: 955,
  };
  for (const view of entry.views) fields.push(roundedMark(viewCenters[view], 611, 82, 34));

  const qualityCenters: Record<HeartCaseFields["imageQuality"], number | null> = {
    not_recorded: null,
    good: 477,
    acceptable: 714,
    poor: 952,
  };
  const qualityX = qualityCenters[entry.imageQuality];
  if (qualityX !== null) fields.push(roundedMark(qualityX, 660, 82, 34));

  const findingCenters = { yes: 686, no: 852, unable: 1001 } as const;
  for (const [key, y] of assessmentRows) {
    const value = entry.findings[key];
    if (value === "yes" || value === "no" || value === "unable") {
      fields.push(roundedMark(findingCenters[value], y));
    }
  }

  const summary = [entry.diagnosis.trim() && `Diagnosis: ${entry.diagnosis.trim()}`, entry.summary.trim()]
    .filter(Boolean)
    .join("\n");
  fields.push(wrappedText(summary, 615, 1152, 56, 7));

  const base = import.meta.env.BASE_URL;
  const templateUrl = `${base}templates/fusic-heart-report-form-v13.svg`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Heart case report form · ${escapePrintText(entry.date)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; color: #111; font-family: Arial, Helvetica, sans-serif; }
    .toolbar { width: min(210mm, calc(100vw - 24px)); margin: 16px auto; }
    .toolbar button { padding: 9px 14px; border: 0; border-radius: 6px; background: #17675d; color: white; font-size: 10pt; font-weight: 700; cursor: pointer; }
    .preview-note { width: min(210mm, calc(100vw - 24px)); margin: 0 auto 12px; color: #53625a; font-size: 12px; line-height: 1.45; }
    .ics-form-sheet { position: relative; width: 210mm; height: 297mm; margin: 0 auto 16px; overflow: hidden; background: white; }
    .ics-form-background, .ics-form-overlay { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
    .ics-form-background { object-fit: fill; }
    .ics-form-overlay { pointer-events: none; }
    @page { size: A4 portrait; margin: 0; }
    @media print {
      .toolbar, .preview-note { display: none; }
      .ics-form-sheet { margin: 0; break-after: page; page-break-after: always; }
      .ics-form-sheet:last-child { break-after: auto; page-break-after: auto; }
    }
    @media screen {
      body { padding: 1px; background: #e9ece9; }
      .ics-form-sheet { width: min(210mm, calc(100vw - 24px)); height: auto; aspect-ratio: 210 / 297; box-shadow: 0 2px 12px #0002; }
    }
  </style>
</head>
<body>
  <div class="toolbar"><button onclick="window.print()">Print / save PDF</button></div>
  <p class="preview-note">Prefilled from this CritSono case record using the ICS Heart report-form layout (Assessment Pack 2025 v13). Demographics appear when recorded; signatures, mentor feedback, and unsupported ventilation choices remain blank for completion by hand.</p>
  <main class="ics-form-sheet">
    <img class="ics-form-background" src="${templateUrl}" alt="">
    <svg class="ics-form-overlay" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1192 1684" preserveAspectRatio="none" aria-hidden="true">${fields.join("")}</svg>
  </main>
</body>
</html>`;
}
