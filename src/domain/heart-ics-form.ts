import type { HeartCaseFields } from "./logbook";
import {
  type FormBox,
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

const heartTextBoxes = {
  demographics: { x: 366, y: 337.5, width: 280, height: 50 },
  operator: { x: 849, y: 337.5, width: 260, height: 50 },
  indication: { x: 371, y: 397.5, width: 720, height: 50 },
  heartRate: { x: 442, y: 504, width: 220, height: 24 },
  bloodPressure: { x: 688, y: 504, width: 220, height: 24 },
  centralVenousPressure: { x: 925, y: 504, width: 230, height: 24 },
  cardiovascularSupport: { x: 371, y: 551, width: 740, height: 24 },
  summary: { x: 615, y: 1139.5, width: 560, height: 175 },
} satisfies Record<string, FormBox>;

function centeredBox(
  centerX: number,
  centerY: number,
  width = 34,
  height = 34,
): FormBox {
  return { x: centerX - width / 2, y: centerY - height / 2, width, height };
}

function createHeartFormSheet(entry: HeartCaseFields) {
  const fields: string[] = [];
  const demographics = [
    entry.patientAge.trim() && `Age ${entry.patientAge.trim()}`,
    entry.patientGender.trim(),
    entry.patientBmi.trim() && `BMI ${entry.patientBmi.trim()}`,
  ].filter(Boolean).join(" · ");
  fields.push(svgWrappedText(demographics, heartTextBoxes.demographics, { lineHeight: 25 }));
  fields.push(svgWrappedText(entry.operatorName, heartTextBoxes.operator, { lineHeight: 25 }));
  fields.push(svgWrappedText(entry.indication, heartTextBoxes.indication, { lineHeight: 25 }));
  fields.push(svgText(entry.heartRate, heartTextBoxes.heartRate, { size: 18 }));
  fields.push(svgText(entry.bloodPressure, heartTextBoxes.bloodPressure, { size: 18 }));
  fields.push(svgText(entry.centralVenousPressure, heartTextBoxes.centralVenousPressure, { size: 18 }));
  fields.push(svgText(entry.cardiovascularSupport, heartTextBoxes.cardiovascularSupport, { size: 18 }));

  if (entry.ventilatorySupport === "IPPV") {
    fields.push(svgRoundedMark(centeredBox(477, 467, 82, 34)));
  }

  const viewCenters: Record<string, number> = {
    PLAX: 417,
    PSAX: 538,
    "Apical 4-chamber": 654,
    "Subcostal 4-chamber": 774,
    IVC: 955,
  };
  for (const view of entry.views) {
    fields.push(svgRoundedMark(centeredBox(viewCenters[view], 611, 82, 34)));
  }

  const qualityBoxes: Record<HeartCaseFields["imageQuality"], FormBox | null> = {
    not_recorded: null,
    good: centeredBox(477, 660, 82, 34),
    acceptable: centeredBox(714, 660, 150, 34),
    poor: centeredBox(952, 660, 82, 34),
  };
  const qualityBox = qualityBoxes[entry.imageQuality];
  if (qualityBox) fields.push(svgRoundedMark(qualityBox));

  const findingCenters = { yes: 686, no: 852, unable: 1001 } as const;
  for (const [key, y] of assessmentRows) {
    const value = entry.findings[key];
    if (value === "yes" || value === "no" || value === "unable") {
      fields.push(svgRoundedMark(centeredBox(findingCenters[value], y)));
    }
  }

  const summary = [entry.diagnosis.trim() && `Diagnosis: ${entry.diagnosis.trim()}`, entry.summary.trim()]
    .filter(Boolean)
    .join("\n");
  fields.push(svgWrappedText(summary, heartTextBoxes.summary, { lineHeight: 25 }));

  const base = import.meta.env.BASE_URL;
  const templateUrl = `${base}templates/fusic-heart-report-form-v13.svg`;
  return createFusicFormSheet(templateUrl, fields.join(""));
}

export function createHeartIcsFormPrintDocument(entry: HeartCaseFields) {
  return createFusicFormPrintDocument({
    title: `Heart case report form · ${entry.date}`,
    previewNote: "Prefilled from this CritSono case record using the FUSIC® Heart report-form template from the Intensive Care Society (ICS) Assessment Pack, v13 (2025). Demographics appear when recorded; signatures, mentor feedback, and unsupported ventilation choices remain blank for completion by hand.",
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
    previewNote: `One FUSIC® Heart report form per saved Heart case (${entries.length} cases), based on the Intensive Care Society (ICS) Assessment Pack, v13 (2025). Demographics appear when recorded; signatures and mentor feedback remain blank for completion by hand.`,
    sheets,
  });
}
