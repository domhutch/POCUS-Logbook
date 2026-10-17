import { LUNG_FINDINGS, LUNG_REGIONS, type LogbookCase } from "../../domain/logbook";
type Entry = Extract<LogbookCase, { pathway: "lung" }>;
const assessment = (value: string) => value === "not_assessed" ? "Not assessed" : value === "unable" ? "Unable to assess" : value === "yes" ? "Yes" : "No";
export const lungCsvColumns = () => ["Age (years)", "Gender", "BMI", "Ventilatory support", "Regions scanned", ...LUNG_REGIONS.flatMap((region) => LUNG_FINDINGS.map(([, label]) => region + " · " + label))];
export function lungCsvValues(entry: Entry) {
  return [entry.patientAge.trim(), entry.patientGender.trim(), entry.patientBmi.trim(), entry.ventilatorySupport.trim(), entry.regions.join("; "), ...LUNG_REGIONS.flatMap((region) => LUNG_FINDINGS.map(([key]) => assessment(entry.findings[region][key])))];
}
