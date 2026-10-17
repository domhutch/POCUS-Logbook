import type { LogbookCase } from "../../domain/logbook";
type Entry = Extract<LogbookCase, { pathway: "abdomen" }>;
export const abdomenCsvColumns = () => ["Age (years)", "Gender", "BMI", "Examination points attempted", "RUQ · diaphragm and liver", "LUQ · diaphragm and spleen", "Right kidney", "Right hydronephrosis", "Left kidney", "Left hydronephrosis", "Bladder size", "Bladder description", "Free fluid", "Other comments"];
export function abdomenCsvValues(entry: Entry) {
  return [entry.patientAge.trim(), entry.patientGender.trim(), entry.patientBmi.trim(), entry.examinationPoints.join("; "), entry.rightUpperQuadrant, entry.leftUpperQuadrant, entry.rightKidney, entry.rightHydronephrosis, entry.leftKidney, entry.leftHydronephrosis, entry.bladderSize, entry.bladderDescription, entry.freeFluid, entry.otherComments];
}
