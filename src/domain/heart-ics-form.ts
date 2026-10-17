import type { HeartCaseFields } from "./logbook";
import {
  createFusicFormCollectionPrintDocument,
  createFusicFormPrintDocument,
  createFusicFormSheet,
  svgRoundedMark,
  svgText,
  svgWrappedText,
} from "./fusic-forms";

const assessmentRows = [
  ["lvDilated", 810],
  ["lvSignificantlyImpaired", 859],
  ["rvDilated", 907],
  ["rvSignificantlyImpaired", 955],
  ["lowPreload", 1003],
  ["pericardialFluid", 1050],
  ["pleuralFluid", 1097],
] as const;

function createHeartFormSheet(entry: HeartCaseFields) {
  const fields: string[] = [];
  const demographics = [
    entry.patientAge.trim() && `Age ${entry.patientAge.trim()}`,
    entry.patientGender.trim(),
    entry.patientBmi.trim() && `BMI ${entry.patientBmi.trim()}`,
  ].filter(Boolean).join(" · ");
  fields.push(svgWrappedText(demographics, 366, 350, 29, 2, { lineHeight: 25 }));
  fields.push(svgWrappedText(entry.operatorName, 849, 350, 27, 2, { lineHeight: 25 }));
  fields.push(svgWrappedText(entry.indication, 371, 410, 76, 2, { lineHeight: 25 }));
  fields.push(svgText(entry.heartRate, 442, 516, { size: 18 }));
  fields.push(svgText(entry.bloodPressure, 688, 516, { size: 18 }));
  fields.push(svgText(entry.centralVenousPressure, 925, 516, { size: 18 }));
  fields.push(svgText(entry.cardiovascularSupport, 371, 563, { size: 18 }));

  if (entry.ventilatorySupport === "IPPV") fields.push(svgRoundedMark(477, 467, 82, 34));

  const viewCenters: Record<string, number> = {
    PLAX: 417,
    PSAX: 538,
    "Apical 4-chamber": 654,
    "Subcostal 4-chamber": 774,
    IVC: 955,
  };
  for (const view of entry.views) fields.push(svgRoundedMark(viewCenters[view], 611, 82, 34));

  const qualityCenters: Record<HeartCaseFields["imageQuality"], number | null> = {
    not_recorded: null,
    good: 477,
    acceptable: 714,
    poor: 952,
  };
  const qualityX = qualityCenters[entry.imageQuality];
  if (qualityX !== null) fields.push(svgRoundedMark(qualityX, 660, 82, 34));

  const findingCenters = { yes: 686, no: 852, unable: 1001 } as const;
  for (const [key, y] of assessmentRows) {
    const value = entry.findings[key];
    if (value === "yes" || value === "no" || value === "unable") {
      fields.push(svgRoundedMark(findingCenters[value], y));
    }
  }

  const summary = [entry.diagnosis.trim() && `Diagnosis: ${entry.diagnosis.trim()}`, entry.summary.trim()]
    .filter(Boolean)
    .join("\n");
  fields.push(svgWrappedText(summary, 615, 1152, 56, 7, { lineHeight: 25 }));

  const base = import.meta.env.BASE_URL;
  const templateUrl = `${base}templates/fusic-heart-report-form-v13.svg`;
  return createFusicFormSheet(templateUrl, fields.join(""));
}

export function createHeartIcsFormPrintDocument(entry: HeartCaseFields) {
  return createFusicFormPrintDocument({
    title: `Heart case report form · ${entry.date}`,
    previewNote: "Prefilled from this CritSono case record using the ICS Heart report-form layout (Assessment Pack 2025 v13). Demographics appear when recorded; signatures, mentor feedback, and unsupported ventilation choices remain blank for completion by hand.",
    sheet: createHeartFormSheet(entry),
  });
}

export function createHeartIcsFormsPrintDocument(
  entries: HeartCaseFields[],
  defaultOperatorName = "",
) {
  if (entries.length === 0) {
    throw new Error("There are no Heart cases to include in this ICS PDF.");
  }

  const sheets = entries.map((entry) => createHeartFormSheet({
    ...entry,
    operatorName: defaultOperatorName.trim() || entry.operatorName,
  }));
  return createFusicFormCollectionPrintDocument({
    title: "ICS Heart logbook report forms",
    previewNote: `One ICS Heart logbook report form per saved Heart case (${entries.length} cases). Demographics appear when recorded; signatures and mentor feedback remain blank for completion by hand.`,
    sheets,
  });
}
