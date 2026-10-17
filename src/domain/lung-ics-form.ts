import type { LungCaseFields } from "./logbook";
import {
  createFusicFormCollectionPrintDocument,
  createFusicFormPrintDocument,
  createFusicFormSheet,
  svgRoundedMark,
  svgWrappedText,
} from "./fusic-forms";

const regions = [
  ["Right upper anterior", 815],
  ["Right lower anterior", 888],
  ["Right posterolateral", 961],
  ["Left upper anterior", 1100],
  ["Left lower anterior", 1174],
  ["Left posterolateral", 1246],
] as const;
const findings = ["lungSliding", "bLines", "consolidation", "pleuralEffusion"] as const;
const responseCenters = [[333, 402], [476, 557], [642, 732], [815, 888]] as const;

function createLungFormSheet(entry: LungCaseFields, operatorName = "") {
  const fields: string[] = [];
  const demographics = [
    entry.patientAge.trim() && `Age ${entry.patientAge.trim()}`,
    entry.patientGender.trim(),
    entry.patientBmi.trim() && `BMI ${entry.patientBmi.trim()}`,
  ].filter(Boolean).join(" · ");
  fields.push(svgWrappedText(demographics, 365, 306, 30, 2));
  fields.push(svgWrappedText(operatorName, 725, 306, 32, 2));
  fields.push(svgWrappedText(entry.indication, 365, 385, 76, 2));

  const ventilatoryCenters: Record<string, [number, number]> = {
    None: [422, 64], IPPV: [534, 64], "PSV / spontaneous": [653, 100], "PSV/SPONT": [653, 100],
    BiPAP: [791, 76], BIPAP: [791, 76], "CPAP / NHF": [968, 116], "CPAP/NHF": [968, 116],
  };
  const ventilation = ventilatoryCenters[entry.ventilatorySupport.trim()];
  if (ventilation) fields.push(svgRoundedMark(ventilation[0], 454, ventilation[1]));

  const qualityMarks = { good: [474, 78], acceptable: [721, 120], poor: [968, 78] } as const;
  if (entry.imageQuality in qualityMarks) {
    const [x, width] = qualityMarks[entry.imageQuality as keyof typeof qualityMarks];
    fields.push(svgRoundedMark(x, 525, width));
  }

  for (const [region, y] of regions) {
    const responses = entry.findings[region];
    findings.forEach((finding, index) => {
      const value = responses[finding];
      if (value === "yes" || value === "no") fields.push(svgRoundedMark(responseCenters[index][value === "yes" ? 0 : 1], y, 58));
    });
  }

  const comments = [entry.diagnosis.trim() && `Diagnosis: ${entry.diagnosis.trim()}`, entry.summary.trim()]
    .filter(Boolean).join("\n");
  fields.push(svgWrappedText(comments, 300, 1320, 68, 5));

  const base = import.meta.env.BASE_URL;
  const templateUrl = `${base}templates/fusic-lung-report-form-v10.svg`;
  return createFusicFormSheet(templateUrl, fields.join(""));
}

export function createLungIcsFormPrintDocument(entry: LungCaseFields, operatorName = "") {
  return createFusicFormPrintDocument({
    title: `Lung case report form · ${entry.date}`,
    previewNote: "Prefilled from this CritSono Lung case using the FUSIC® Lung report-form template from the Intensive Care Society (ICS) Assessment Pack, v10 (2025). Demographics and operator appear when recorded; unsupported findings and unrecorded fields remain blank for completion by hand.",
    sheet: createLungFormSheet(entry, operatorName),
  });
}

export function createLungIcsFormsPrintDocument(entries: LungCaseFields[], operatorName = "") {
  if (entries.length === 0) {
    throw new Error("There are no Lung cases to include in this ICS PDF.");
  }
  return createFusicFormCollectionPrintDocument({
    title: "ICS Lung logbook report forms",
    previewNote: `One FUSIC® Lung report form per saved Lung case (${entries.length} cases), based on the Intensive Care Society (ICS) Assessment Pack, v10 (2025). Demographics and operator appear when recorded; unsupported fields remain blank for completion by hand.`,
    sheets: entries.map((entry) => createLungFormSheet(entry, operatorName)),
  });
}
