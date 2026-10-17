import { DVT_SITE_FINDINGS, DVT_SITES, type LogbookCase } from "../../domain/logbook";
type Entry = Extract<LogbookCase, { pathway: "dvt" }>;
export function getDvtMetrics(cases: Entry[]) {
  return {
    scanDetails: DVT_SITES.map((site) => ({ label: site, count: cases.filter((entry) => Object.values(entry.findings[site]).some((finding) => finding !== "not_assessed")).length })),
    findings: DVT_SITE_FINDINGS.map(([key, label]) => ({ label, count: cases.filter((entry) => DVT_SITES.some((site) => entry.findings[site][key] === "yes")).length })),
  };
}

export function countPositiveDvtScans(cases: Entry[]) {
  return cases.filter((entry) => DVT_SITES.some((site) =>
    entry.findings[site].occlusiveThrombus === "yes" ||
    entry.findings[site].nonOcclusiveThrombus === "yes",
  )).length;
}
