import { HEART_FINDINGS, type LogbookCase } from "../../domain/logbook";
type Entry = Extract<LogbookCase, { pathway: "heart" }>;
const assessment = (value: string) => value === "not_assessed" ? "Not assessed" : value === "unable" ? "Unable to assess" : value === "yes" ? "Yes" : "No";
export const heartCsvColumns = () => ["Age (years)", "Gender", "BMI", "Operator", "Ventilatory support", "Views obtained", "Cardiovascular support", "Heart rate", "Blood pressure", "Central venous pressure", ...HEART_FINDINGS.map(([, label]) => label)];
export function heartCsvValues(entry: Entry) {
  return [entry.patientAge.trim(), entry.patientGender.trim(), entry.patientBmi.trim(), entry.operatorName.trim(), entry.ventilatorySupport.trim(), entry.views.join("; "), entry.cardiovascularSupport.trim(), entry.heartRate.trim(), entry.bloodPressure.trim(), entry.centralVenousPressure.trim(), ...HEART_FINDINGS.map(([key]) => assessment(entry.findings[key]))];
}
