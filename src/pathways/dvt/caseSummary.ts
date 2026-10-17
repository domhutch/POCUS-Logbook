import type { LogbookCase } from "../../domain/logbook";

export function dvtCaseSummary(entry: Extract<LogbookCase, { pathway: "dvt" }>) {
  const recordedSites = Object.values(entry.findings).filter((site) =>
    Object.values(site).some((finding) => finding !== "not_assessed"),
  ).length;
  const hasDetails = Boolean(entry.otherComments) || recordedSites > 0;
  return hasDetails ? `${recordedSites} venous sites reviewed` : "Structured details not added";
}
