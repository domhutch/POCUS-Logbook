import type { CaseMixSummary } from "../domain/metrics";
import type { LogbookCase, Pathway } from "../domain/logbook";
import { countPositiveDvtScans } from "./dvt/metrics";
import { getVascularQuotaMetrics } from "./vascular/metrics";

type ScanTypeQuota = Omit<CaseMixSummary["scanTypeQuotas"][number], "recordedScans" | "supervisedScans">;

export function pathwayCaseMixMetrics(
  cases: LogbookCase[],
  pathway: Pathway,
  quotas: readonly ScanTypeQuota[],
): Pick<CaseMixSummary, "scanTypeQuotas" | "positiveScans"> {
  if (pathway === "dvt") {
    const dvtCases = cases.filter((entry): entry is Extract<LogbookCase, { pathway: "dvt" }> => entry.pathway === "dvt");
    return {
      scanTypeQuotas: quotas.map((quota) => ({ ...quota, recordedScans: 0, supervisedScans: 0 })),
      positiveScans: countPositiveDvtScans(dvtCases),
    };
  }
  if (pathway === "vascular") {
    const vascularCases = cases.filter((entry): entry is Extract<LogbookCase, { pathway: "vascular" }> => entry.pathway === "vascular");
    return {
      scanTypeQuotas: getVascularQuotaMetrics(vascularCases, quotas),
      positiveScans: null,
    };
  }
  return {
    scanTypeQuotas: quotas.map((quota) => ({ ...quota, recordedScans: 0, supervisedScans: 0 })),
    positiveScans: null,
  };
}
