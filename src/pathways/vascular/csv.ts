import { VASCULAR_ASSESSMENTS, VASCULAR_PROCEDURES, type LogbookCase } from "../../domain/logbook";
type Entry = Extract<LogbookCase, { pathway: "vascular" }>;
const assessment = (value: string) => value === "not_assessed" ? "Not assessed" : value === "unable" ? "Unable to assess" : value === "yes" ? "Yes" : "No";
export const vascularCsvColumns = () => ["Procedure category", "Procedure", "Site of insertion", "Type of line", "PICC/midline quota substitution", ...VASCULAR_ASSESSMENTS.map(([, label]) => label), "Comments"];
export function vascularCsvValues(entry: Entry) {
  return [VASCULAR_PROCEDURES.find(([key]) => key === entry.procedureCategory)?.[1] ?? entry.procedureCategory, entry.procedure.trim(), entry.insertionSite.trim(), entry.lineType.trim(), entry.piccMidlineSubstitution ? "Yes" : "No", ...VASCULAR_ASSESSMENTS.map(([key]) => assessment(entry.assessments[key])), entry.otherComments.trim()];
}
