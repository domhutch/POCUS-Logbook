import type { LogbookCase } from "../domain/logbook";
import { abdomenPrintDetails } from "./abdomen/print";
import { dvtPrintDetails } from "./dvt/print";
import { hdPrintDetails } from "./hd/print";
import { heartPrintDetails } from "./heart/print";
import { lungPrintDetails } from "./lung/print";
import { vascularPrintDetails } from "./vascular/print";

export function pathwayPrintDetails(entry: LogbookCase) {
  switch (entry.pathway) {
    case "lung": return lungPrintDetails(entry);
    case "heart": return heartPrintDetails(entry);
    case "abdomen": return abdomenPrintDetails(entry);
    case "dvt": return dvtPrintDetails(entry);
    case "hd": return hdPrintDetails(entry);
    case "vascular": return vascularPrintDetails(entry);
    default: { const unreachable: never = entry; return unreachable; }
  }
}
