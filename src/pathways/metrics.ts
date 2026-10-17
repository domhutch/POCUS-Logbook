import type { LogbookCase, Pathway } from "../domain/logbook";
import { getAbdomenMetrics } from "./abdomen/metrics";
import { getDvtMetrics } from "./dvt/metrics";
import { getHdMetrics } from "./hd/metrics";
import { getHeartMetrics } from "./heart/metrics";
import { getLungMetrics } from "./lung/metrics";
import { getVascularMetrics } from "./vascular/metrics";

export function pathwayMetrics(cases: LogbookCase[], pathway: Pathway) {
  switch (pathway) {
    case "lung": return getLungMetrics(cases.filter((entry): entry is Extract<LogbookCase, { pathway: "lung" }> => entry.pathway === "lung"));
    case "heart": return getHeartMetrics(cases.filter((entry): entry is Extract<LogbookCase, { pathway: "heart" }> => entry.pathway === "heart"));
    case "abdomen": return getAbdomenMetrics(cases.filter((entry): entry is Extract<LogbookCase, { pathway: "abdomen" }> => entry.pathway === "abdomen"));
    case "dvt": return getDvtMetrics(cases.filter((entry): entry is Extract<LogbookCase, { pathway: "dvt" }> => entry.pathway === "dvt"));
    case "hd": return getHdMetrics(cases.filter((entry): entry is Extract<LogbookCase, { pathway: "hd" }> => entry.pathway === "hd"));
    case "vascular": return getVascularMetrics(cases.filter((entry): entry is Extract<LogbookCase, { pathway: "vascular" }> => entry.pathway === "vascular"));
    default: {
      const unreachable: never = pathway;
      return unreachable;
    }
  }
}
