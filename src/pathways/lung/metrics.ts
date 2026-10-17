import { LUNG_FINDINGS, LUNG_REGIONS, type LogbookCase } from "../../domain/logbook";
type Entry = Extract<LogbookCase, { pathway: "lung" }>;
export function getLungMetrics(cases: Entry[]) {
  return {
    scanDetails: LUNG_REGIONS.map((region) => ({ label: region, count: cases.filter((entry) => entry.regions.includes(region)).length })),
    findings: LUNG_FINDINGS.map(([key, label]) => ({ label, count: cases.filter((entry) => LUNG_REGIONS.some((region) => entry.findings[region][key] === "yes")).length })),
  };
}
