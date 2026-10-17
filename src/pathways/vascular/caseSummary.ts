import type { LogbookCase } from "../../domain/logbook";

export function vascularCaseSummary(entry: Extract<LogbookCase, { pathway: "vascular" }>) {
  const checks = Object.values(entry.assessments).filter((finding) => finding !== "not_assessed").length;
  const hasDetails = Boolean(entry.procedure || entry.insertionSite || entry.lineType || entry.piccMidlineSubstitution || entry.otherComments) || checks > 0;
  return hasDetails ? `${entry.procedureCategory.replaceAll("_", " ")} · ${checks} checks recorded` : "Structured details not added";
}
