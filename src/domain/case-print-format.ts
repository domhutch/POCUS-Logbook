import type { Assessment } from "./logbook";
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[character];
  });
}
export function displayValue(value: string) {
  return value.trim() ? escapeHtml(value.trim()) : '<span class="muted">Not recorded</span>';
}
export function field(label: string, value: string) {
  return '<div class="field"><span class="field-label">' + escapeHtml(label) + '</span><span class="field-value">' + displayValue(value) + '</span></div>';
}
export function assessmentChoices(value: Assessment) {
  if (value === "not_assessed") return '<span class="not-recorded">Not recorded</span>';
  const options = [["yes", "Yes"], ["no", "No"], ["unable", "U/A"]] as const;
  return '<span class="choices">' + options.map(([key, label]) =>
    '<span class="choice ' + (value === key ? "selected" : "") + '">' + label + "</span>",
  ).join("") + "</span>";
}
