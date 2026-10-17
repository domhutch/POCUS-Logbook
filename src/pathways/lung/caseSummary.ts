import type { LogbookCase } from "../../domain/logbook";

export function lungCaseSummary(entry: Extract<LogbookCase, { pathway: "lung" }>) {
  return entry.regions.length ? `${entry.regions.length} of 6 regions recorded` : "Structured details not added";
}
