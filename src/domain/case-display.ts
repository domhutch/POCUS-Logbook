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

/** Numbers cases by pathway and scan date; IDs stay stable for storage and imports. */
export function getCaseSequenceNumbers(cases: LogbookCase[]) {
  const byPathway = new Map<string, LogbookCase[]>();
  for (const entry of cases) {
    const pathwayCases = byPathway.get(entry.pathway) ?? [];
    pathwayCases.push(entry);
    byPathway.set(entry.pathway, pathwayCases);
  }

  const sequenceNumbers = new Map<string, number>();
  for (const pathwayCases of byPathway.values()) {
    pathwayCases
      .slice()
      .sort(
        (first, second) =>
          first.date.localeCompare(second.date) ||
          first.createdAt.localeCompare(second.createdAt) ||
          first.id.localeCompare(second.id),
      )
      .forEach((entry, index) => sequenceNumbers.set(entry.id, index + 1));
  }
  return sequenceNumbers;
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
