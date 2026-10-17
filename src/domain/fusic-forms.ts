export function escapeFormText(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

export function svgText(
  value: string,
  x: number,
  y: number,
  options: { size?: number; anchor?: "start" | "middle" | "end" } = {},
) {
  const content = value.trim();
  if (!content) return "";
  const anchor = options.anchor ?? "start";
  const size = options.size ?? 18;
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="${size}" fill="#111">${escapeFormText(content)}</text>`;
}

export function svgWrappedText(
  value: string,
  x: number,
  y: number,
  maxCharacters: number,
  maxLines: number,
  options: { size?: number; lineHeight?: number } = {},
) {
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
  const size = options.size ?? 17;
  const lineHeight = options.lineHeight ?? 24;
  return lines.slice(0, maxLines).map((item, index) =>
    svgText(item, x, y + index * lineHeight, { size }),
  ).join("");
}

export function svgRoundedMark(x: number, y: number, width = 34, height = 34) {
  return `<rect x="${x - width / 2}" y="${y - height / 2}" width="${width}" height="${height}" rx="6" fill="none" stroke="#111" stroke-width="2.5"/>`;
}

export function createFusicFormSheet(templateUrl: string, fields: string) {
  return `<main class="ics-form-sheet"><img class="ics-form-background" src="${templateUrl}" alt=""><svg class="ics-form-overlay" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1192 1684" preserveAspectRatio="none" aria-hidden="true">${fields}</svg></main>`;
}

const FORM_STYLES = `
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
`;

export function createFusicFormPrintDocument(options: {
  title: string;
  previewNote: string;
  sheet: string;
}) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeFormText(options.title)}</title><style>${FORM_STYLES}</style></head><body>
<div class="toolbar"><button onclick="window.print()">Print / save PDF</button></div>
<p class="preview-note">${escapeFormText(options.previewNote)}</p>
${options.sheet}</body></html>`;
}

export function createFusicFormCollectionPrintDocument(options: {
  title: string;
  previewNote: string;
  sheets: string[];
}) {
  if (options.sheets.length === 0) {
    throw new Error("There are no report forms to include in this PDF.");
  }
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeFormText(options.title)}</title><style>${FORM_STYLES}</style></head><body>
<div class="toolbar"><button onclick="window.print()">Print / save PDF</button></div>
<p class="preview-note">${escapeFormText(options.previewNote)}</p>
<main class="ics-form-collection">${options.sheets.join("")}</main></body></html>`;
}
