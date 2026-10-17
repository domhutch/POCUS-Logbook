import { VASCULAR_ASSESSMENTS, VASCULAR_PROCEDURES, type LogbookCase } from "../../domain/logbook";
import type { CaseMixSummary } from "../../domain/metrics";
type Entry = Extract<LogbookCase, { pathway: "vascular" }>;
export function getVascularMetrics(cases: Entry[]) {
  return {
    scanDetails: VASCULAR_PROCEDURES.map(([key, label]) => ({ label, count: cases.filter((entry) => entry.procedureCategory === key).length })),
    findings: VASCULAR_ASSESSMENTS.map(([key, label]) => ({ label, count: cases.filter((entry) => entry.assessments[key] === "yes").length })),
  };
}

export function getVascularQuotaMetrics(
  cases: Entry[],
  quotas: readonly Omit<CaseMixSummary["scanTypeQuotas"][number], "recordedScans" | "supervisedScans">[],
): CaseMixSummary["scanTypeQuotas"] {
  return quotas.map((quota, index) => {
    const procedureCategory = VASCULAR_PROCEDURES[index]?.[0];
    const quotaCases = cases.filter((entry) =>
      entry.procedureCategory === procedureCategory ||
      (procedureCategory === "picc_midline" &&
        entry.procedureCategory === "peripheral_access" &&
        entry.piccMidlineSubstitution),
    );
    return {
      ...quota,
      recordedScans: quotaCases.length,
      supervisedScans: quotaCases.filter((entry) => entry.supervised).length,
    };
  });
}
