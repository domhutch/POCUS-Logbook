import type { LogbookCase } from "../../domain/logbook";

export function heartCaseSummary(entry: Extract<LogbookCase, { pathway: "heart" }>) {
  return entry.views.length ? `${entry.views.length} views recorded` : "Structured details not added";
}
