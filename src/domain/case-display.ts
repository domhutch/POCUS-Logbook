import type {
  Assessment,
  ImageQuality,
  ImpressionCategory,
  LogbookCase,
  ManagementImpact,
} from "./logbook";

export const ASSESSMENT_LABELS: Record<Assessment, string> = {
  not_assessed: "Not assessed",
  yes: "Yes",
  no: "No",
  unable: "Unable to assess",
};

export function formatCaseDate(
  date: string,
  locale?: string,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(
    locale,
    options,
  );
}

export function formatImpression(value: ImpressionCategory) {
  if (value === "not_recorded") return "Not recorded";
  if (value === "abnormal") return "Abnormal / pathology";
  return value[0].toUpperCase() + value.slice(1);
}

export function formatManagementImpact(value: ManagementImpact) {
  if (value === "not_recorded") return "Not recorded";
  return value === "changed" ? "Changed" : "Unchanged";
}

export function formatImageQuality(value: ImageQuality) {
  if (value === "not_recorded") return "Not recorded";
  return value[0].toUpperCase() + value.slice(1);
}

export function formatSupervision(entry: LogbookCase) {
  if (!entry.supervised) return "Not directly supervised";
  return `Directly supervised${entry.supervisorName.trim() ? ` · ${entry.supervisorName.trim()}` : ""}`;
}
