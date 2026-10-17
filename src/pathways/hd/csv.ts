import { HD_MEASUREMENTS, HD_QUESTIONS, type LogbookCase } from "../../domain/logbook";
type Entry = Extract<LogbookCase, { pathway: "hd" }>;
const assessment = (value: string) => value === "not_assessed" ? "Not assessed" : value === "unable" ? "Unable to assess" : value === "yes" ? "Yes" : "No";
export const hdCsvColumns = () => [...HD_QUESTIONS.flatMap(([, label]) => [label + " · Finding", label + " · Notes"]), ...HD_MEASUREMENTS.map(([, label]) => label), "Other comments"];
export function hdCsvValues(entry: Entry) {
  return [...HD_QUESTIONS.flatMap(([key]) => [assessment(entry.questionFindings[key]), entry.questionNotes[key].trim()]), ...HD_MEASUREMENTS.map(([key]) => entry.measurements[key].trim()), entry.otherComments.trim()];
}
