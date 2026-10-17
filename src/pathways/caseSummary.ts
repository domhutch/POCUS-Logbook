import type { LogbookCase } from "../domain/logbook";
import { abdomenCaseSummary } from "./abdomen/caseSummary";
import { dvtCaseSummary } from "./dvt/caseSummary";
import { hdCaseSummary } from "./hd/caseSummary";
import { heartCaseSummary } from "./heart/caseSummary";
import { lungCaseSummary } from "./lung/caseSummary";
import { vascularCaseSummary } from "./vascular/caseSummary";

export function pathwayCaseSummary(entry: LogbookCase) {
  switch (entry.pathway) {
    case "lung": return lungCaseSummary(entry);
    case "heart": return heartCaseSummary(entry);
    case "abdomen": return abdomenCaseSummary(entry);
    case "dvt": return dvtCaseSummary(entry);
    case "hd": return hdCaseSummary(entry);
    case "vascular": return vascularCaseSummary(entry);
    default: {
      const unreachable: never = entry;
      return unreachable;
    }
  }
}
