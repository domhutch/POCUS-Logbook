import type { LogbookCase, Pathway } from "../domain/logbook";
import { abdomenCsvColumns, abdomenCsvValues } from "./abdomen/csv";
import { dvtCsvColumns, dvtCsvValues } from "./dvt/csv";
import { hdCsvColumns, hdCsvValues } from "./hd/csv";
import { heartCsvColumns, heartCsvValues } from "./heart/csv";
import { lungCsvColumns, lungCsvValues } from "./lung/csv";
import { vascularCsvColumns, vascularCsvValues } from "./vascular/csv";

export function pathwayCsvColumns(pathway: Pathway) {
  switch (pathway) {
    case "lung": return lungCsvColumns();
    case "heart": return heartCsvColumns();
    case "abdomen": return abdomenCsvColumns();
    case "dvt": return dvtCsvColumns();
    case "hd": return hdCsvColumns();
    case "vascular": return vascularCsvColumns();
    default: { const unreachable: never = pathway; return unreachable; }
  }
}

export function pathwayCsvValues(entry: LogbookCase): string[] {
  switch (entry.pathway) {
    case "lung": return lungCsvValues(entry);
    case "heart": return heartCsvValues(entry);
    case "abdomen": return abdomenCsvValues(entry);
    case "dvt": return dvtCsvValues(entry);
    case "hd": return hdCsvValues(entry);
    case "vascular": return vascularCsvValues(entry);
    default: { const unreachable: never = entry; return unreachable; }
  }
}
