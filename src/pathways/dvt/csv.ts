import { DVT_SITE_FINDINGS, DVT_SITES, type LogbookCase } from "../../domain/logbook";
type Entry = Extract<LogbookCase, { pathway: "dvt" }>;
const assessment = (value: string) => value === "not_assessed" ? "Not assessed" : value === "unable" ? "Unable to assess" : value === "yes" ? "Yes" : "No";
export const dvtCsvColumns = () => DVT_SITES.flatMap((site) => DVT_SITE_FINDINGS.map(([, label]) => site + " · " + label)).concat("Other comments");
export function dvtCsvValues(entry: Entry) {
  return [...DVT_SITES.flatMap((site) => DVT_SITE_FINDINGS.map(([key]) => assessment(entry.findings[site][key]))), entry.otherComments.trim()];
}
