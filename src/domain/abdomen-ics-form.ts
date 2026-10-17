import type { AbdomenCaseFields, Hydronephrosis } from "./logbook";
import {
  type FormBox,
  createFusicFormCollectionPrintDocument,
  createFusicFormSheet,
  svgRoundedMark,
  svgText,
  svgWrappedText,
} from "./fusic-forms";

const firstPageTextBoxes = {
  demographics: { x: 394, y: 390, width: 200, height: 74 },
  operator: { x: 922, y: 390, width: 140, height: 74 },
  indication: { x: 394, y: 488, width: 660, height: 48 },
  rightUpperQuadrant: { x: 740, y: 746, width: 320, height: 56 },
  leftUpperQuadrant: { x: 740, y: 892, width: 320, height: 56 },
  rightKidney: { x: 740, y: 1035, width: 320, height: 60 },
  leftKidney: { x: 740, y: 1180, width: 320, height: 60 },
  freeFluid: { x: 740, y: 1398, width: 320, height: 62 },
  otherComments: { x: 740, y: 1470, width: 320, height: 62 },
} satisfies Record<string, FormBox>;

const summaryTextBox = {
  diagnosis: { x: 124, y: 370, width: 940, height: 34 },
  summary: { x: 124, y: 410, width: 940, height: 84 },
  bladder: { x: 124, y: 500, width: 940, height: 40 },
} satisfies Record<string, FormBox>;

function centeredBox(
  centerX: number,
  centerY: number,
  width: number,
  height = 32,
): FormBox {
  return { x: centerX - width / 2, y: centerY - height / 2, width, height };
}

function hydronephrosisMark(value: Hydronephrosis, centerY: number) {
  const marks: Partial<Record<Hydronephrosis, [number, number]>> = {
    none: [763, 56],
    mild: [828, 44],
    moderate: [913, 96],
    severe: [1012, 76],
  };
  const mark = marks[value];
  return mark ? svgRoundedMark(centeredBox(mark[0], centerY, mark[1])) : "";
}

function createAbdomenFormSheets(entry: AbdomenCaseFields, operatorName: string) {
  const firstPageFields: string[] = ['<rect x="124" y="216" width="940" height="48" fill="#fff"/>'];
  const demographics = [
    entry.patientAge.trim() && `Age ${entry.patientAge.trim()}`,
    entry.patientGender.trim(),
    entry.patientBmi.trim() && `BMI ${entry.patientBmi.trim()}`,
  ].filter(Boolean).join(" · ");
  firstPageFields.push(svgWrappedText(demographics, firstPageTextBoxes.demographics, { size: 15, lineHeight: 25 }));
  firstPageFields.push(svgWrappedText(operatorName, firstPageTextBoxes.operator, { size: 15, lineHeight: 25 }));
  firstPageFields.push(svgWrappedText(entry.indication, firstPageTextBoxes.indication, { lineHeight: 24 }));
  firstPageFields.push(svgWrappedText(entry.rightUpperQuadrant, firstPageTextBoxes.rightUpperQuadrant, { size: 15, lineHeight: 17 }));
  firstPageFields.push(svgWrappedText(entry.leftUpperQuadrant, firstPageTextBoxes.leftUpperQuadrant, { size: 15, lineHeight: 17 }));
  firstPageFields.push(svgWrappedText(entry.rightKidney, firstPageTextBoxes.rightKidney, { size: 15, lineHeight: 18 }));
  firstPageFields.push(svgWrappedText(entry.leftKidney, firstPageTextBoxes.leftKidney, { size: 15, lineHeight: 18 }));
  firstPageFields.push(svgWrappedText(entry.freeFluid, firstPageTextBoxes.freeFluid, { size: 15, lineHeight: 18 }));
  firstPageFields.push(svgWrappedText(entry.otherComments, firstPageTextBoxes.otherComments, { size: 15, lineHeight: 18 }));

  const qualityCenters: Partial<Record<AbdomenCaseFields["imageQuality"], [number, number, number]>> = {
    good: [478, 566, 72],
    acceptable: [718, 566, 128],
    poor: [956, 566, 70],
  };
  const quality = qualityCenters[entry.imageQuality];
  if (quality) firstPageFields.push(svgRoundedMark(centeredBox(quality[0], quality[1], quality[2])));

  if (entry.examinationPoints.includes("RUQ (diaphragm and liver)")) {
    firstPageFields.push(svgText("✓", centeredBox(327, 755, 25, 25), { size: 18, anchor: "middle" }));
  }
  if (entry.examinationPoints.includes("LUQ (diaphragm and spleen)")) {
    firstPageFields.push(svgText("✓", centeredBox(327, 900, 25, 25), { size: 18, anchor: "middle" }));
  }
  if (entry.examinationPoints.includes("Right kidney")) {
    firstPageFields.push(svgText("✓", centeredBox(327, 1042, 25, 25), { size: 18, anchor: "middle" }));
  }
  if (entry.examinationPoints.includes("Left kidney")) {
    firstPageFields.push(svgText("✓", centeredBox(327, 1188, 25, 25), { size: 18, anchor: "middle" }));
  }
  if (entry.examinationPoints.includes("Pelvis (bladder)")) {
    firstPageFields.push(svgText("✓", centeredBox(327, 1337, 25, 25), { size: 18, anchor: "middle" }));
  }
  if (entry.examinationPoints.includes("RIF and LIF (ascites)")) {
    firstPageFields.push(svgText("✓", centeredBox(327, 1410, 25, 25), { size: 18, anchor: "middle" }));
  }

  const rightHydronephrosis = hydronephrosisMark(entry.rightHydronephrosis, 1118);
  if (rightHydronephrosis) firstPageFields.push(rightHydronephrosis);
  const leftHydronephrosis = hydronephrosisMark(entry.leftHydronephrosis, 1263);
  if (leftHydronephrosis) firstPageFields.push(leftHydronephrosis);

  const bladderSizes: Partial<Record<AbdomenCaseFields["bladderSize"], [number, number, number]>> = {
    not_seen: [676, 1337, 104],
    small: [766, 1337, 60],
    large: [840, 1337, 64],
  };
  const bladderSize = bladderSizes[entry.bladderSize];
  if (bladderSize) {
    firstPageFields.push(svgRoundedMark(centeredBox(bladderSize[0], bladderSize[1], bladderSize[2])));
  } else if (entry.bladderSize === "normal") {
    firstPageFields.push(svgText("Normal", { x: 884, y: 1324, width: 170, height: 27 }, { size: 15 }));
  }

  const base = import.meta.env.BASE_URL;
  const firstPage = createFusicFormSheet(
    `${base}templates/fusic-abdomen-report-form-v1-2025.svg`,
    firstPageFields.join(""),
  );

  const summary = [
    svgWrappedText(entry.diagnosis.trim() && `Diagnosis: ${entry.diagnosis.trim()}`, summaryTextBox.diagnosis, { size: 16, lineHeight: 20 }),
    svgWrappedText(entry.summary, summaryTextBox.summary, { size: 16, lineHeight: 20 }),
    svgWrappedText(entry.bladderDescription.trim() && `Bladder: ${entry.bladderDescription.trim()}`, summaryTextBox.bladder, { size: 16, lineHeight: 20 }),
  ].join("");
  const secondPageFields = summary;
  const secondPage = createFusicFormSheet(
    `${base}templates/fusic-abdomen-report-form-v1-2025-page2.svg`,
    secondPageFields,
  );
  return [firstPage, secondPage];
}

export function createAbdomenIcsFormPrintDocument(entry: AbdomenCaseFields, operatorName = "") {
  return createFusicFormCollectionPrintDocument({
    title: `Abdomen case report form · ${entry.date}`,
    previewNote: "Prefilled from this CritSono Abdomen case using the two-page ICS Abdomen report-form layout (Assessment Pack 2025 v1). Demographics and operator appear when recorded; signatures and trainer feedback remain blank for completion by hand.",
    sheets: createAbdomenFormSheets(entry, operatorName),
  });
}

export function createAbdomenIcsFormsPrintDocument(entries: AbdomenCaseFields[], operatorName = "") {
  return createFusicFormCollectionPrintDocument({
    title: "ICS Abdomen logbook report forms",
    previewNote: `Two ICS Abdomen report-form pages per saved case (${entries.length} cases). Demographics and operator appear when recorded; signatures and trainer feedback remain blank for completion by hand.`,
    sheets: entries.flatMap((entry) => createAbdomenFormSheets(entry, operatorName)),
  });
}
