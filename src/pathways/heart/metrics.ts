import { HEART_FINDINGS, HEART_VIEWS, type LogbookCase } from "../../domain/logbook";
type Entry = Extract<LogbookCase, { pathway: "heart" }>;
export function getHeartMetrics(cases: Entry[]) {
  return {
    scanDetails: HEART_VIEWS.map((view) => ({ label: view, count: cases.filter((entry) => entry.views.includes(view)).length })),
    findings: HEART_FINDINGS.map(([key, label]) => ({ label, count: cases.filter((entry) => entry.findings[key] === "yes").length })),
  };
}
