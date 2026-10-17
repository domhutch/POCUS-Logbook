import {
  ABDOMEN_EXAMINATION_POINTS,
  DVT_SITES,
  DVT_SITE_FINDINGS,
  HD_MEASUREMENTS,
  HD_QUESTIONS,
  HEART_FINDINGS,
  HEART_VIEWS,
  LUNG_FINDINGS,
  LUNG_REGIONS,
  PATHWAYS,
  VASCULAR_ASSESSMENTS,
  VASCULAR_PROCEDURES,
  addTimestamps,
  createDraft,
  type Assessment,
  type CaseDraft,
  type ImageQuality,
  type LogbookCase,
  type Pathway,
  type VascularProcedure,
} from "./logbook";

const ANSWERS: Assessment[] = ["no", "yes", "no", "unable"];
const IMAGE_QUALITIES: ImageQuality[] = ["good", "acceptable", "good", "poor"];

function assessmentFor(index: number, salt: number): Assessment {
  return ANSWERS[(index + salt) % ANSWERS.length];
}

function dateWithinTrainingWindow(index: number, total: number, now: Date) {
  const daysBack = Math.round((index / Math.max(total - 1, 1)) * 300);
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysBack);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function populateStructuredFields(draft: CaseDraft, index: number) {
  if (draft.pathway === "lung") {
    draft.regions = [...LUNG_REGIONS];
    draft.ventilatorySupport = ["None", "IPPV", "PSV / spontaneous", "CPAP / NHF"][index % 4];
    for (const [regionIndex, region] of LUNG_REGIONS.entries()) {
      for (const [findingIndex, [key]] of LUNG_FINDINGS.entries()) {
        draft.findings[region][key] = assessmentFor(index + regionIndex, findingIndex);
      }
    }
    draft.summary = "All six protocol regions recorded; sample findings are for software testing only.";
    draft.reflection = "Review image acquisition and interpretation with the sample trainer.";
    return;
  }

  if (draft.pathway === "heart") {
    draft.views = [...HEART_VIEWS];
    draft.ventilatorySupport = ["None", "IPPV", "PSV / spontaneous"][index % 3];
    draft.cardiovascularSupport = ["None", "Noradrenaline", "Dobutamine"][index % 3];
    draft.heartRate = String(66 + (index % 12) * 4);
    draft.bloodPressure = `${105 + (index % 8) * 7}/${62 + (index % 6) * 5}`;
    draft.centralVenousPressure = String(4 + (index % 9));
    for (const [findingIndex, [key]] of HEART_FINDINGS.entries()) {
      draft.findings[key] = assessmentFor(index, findingIndex);
    }
    draft.summary = "All core views recorded; sample findings are for software testing only.";
    draft.reflection = "Review the saved views and findings with the sample trainer.";
    return;
  }

  if (draft.pathway === "abdomen") {
    draft.patientAge = String(38 + (index % 47));
    draft.patientGender = index % 2 ? "Female" : "Male";
    draft.patientBmi = String((21 + (index % 17) * 0.7).toFixed(1));
    draft.examinationPoints = [...ABDOMEN_EXAMINATION_POINTS];
    draft.rightUpperQuadrant = index % 2 ? "Liver visualised; no free fluid in this view." : "Liver visualised; sample trace free fluid noted.";
    draft.leftUpperQuadrant = "Spleen and left subphrenic space visualised; no free fluid.";
    draft.rightKidney = "Normal size and cortical appearance; no collecting-system dilatation.";
    draft.rightHydronephrosis = index % 5 === 0 ? "mild" : "none";
    draft.leftKidney = "Normal size and cortical appearance; no collecting-system dilatation.";
    draft.leftHydronephrosis = "none";
    draft.bladderSize = "normal";
    draft.bladderDescription = "Bladder visualised in the pelvis with a smooth outline.";
    draft.freeFluid = index % 2 ? "No free fluid seen in the assessed views." : "Small sample volume of free fluid in the pelvis.";
    draft.otherComments = "All examination points attempted; synthetic sample data.";
    draft.summary = "Structured abdominal survey completed for sample data.";
    draft.reflection = "Review image quality and the full examination with the sample trainer.";
    return;
  }

  if (draft.pathway === "dvt") {
    for (const [siteIndex, site] of DVT_SITES.entries()) {
      for (const [findingIndex, [key]] of DVT_SITE_FINDINGS.entries()) {
        draft.findings[site][key] = key === "fullyCompressible"
          ? "yes"
          : key === "occlusiveThrombus" || key === "nonOcclusiveThrombus"
            ? "no"
            : assessmentFor(index + siteIndex, findingIndex);
      }
    }
    if (index % 4 === 1) {
      const positiveSite = DVT_SITES[(index + 2) % DVT_SITES.length];
      draft.findings[positiveSite].fullyCompressible = "no";
      draft.findings[positiveSite].occlusiveThrombus = "yes";
      draft.impressionCategory = "abnormal";
      draft.diagnosis = "Sample positive DVT finding";
      draft.summary = `Sample thrombus finding at ${positiveSite}; not for clinical use.`;
    } else {
      draft.diagnosis = "No DVT demonstrated in sample examination";
      draft.summary = "Three-point and additional sample sites assessed; no thrombus demonstrated.";
    }
    draft.otherComments = "Synthetic case; trainer review required before clinical interpretation.";
    draft.reflection = "Compare the stored findings with the sample reference diagnosis.";
    return;
  }

  if (draft.pathway === "hd") {
    for (const [questionIndex, [key]] of HD_QUESTIONS.entries()) {
      draft.questionFindings[key] = assessmentFor(index, questionIndex);
      draft.questionNotes[key] = `Sample assessment ${questionIndex + 1}: synthetic finding for review.`;
    }
    for (const [measurementIndex, [key]] of HD_MEASUREMENTS.entries()) {
      const values: Record<string, number> = {
        lvEjectionFraction: 45 + (index % 5) * 5,
        lvotVti: 14 + (index % 6) * 2,
        strokeVolume: 50 + (index % 8) * 5,
        aorticRoot: 30 + (index % 5) * 2,
        ascendingAorta: 32 + (index % 6) * 2,
        rvFac: 28 + (index % 5) * 4,
        rvBasalDiameter: 35 + (index % 5) * 2,
        rvMidDiameter: 28 + (index % 4) * 2,
        rvLongitudinalDiameter: 68 + (index % 6) * 3,
        trVmax: 2.2 + (index % 5) * 0.2,
      };
      draft.measurements[key] = String(values[key] ?? `Sample interpretation ${measurementIndex + 1}`);
    }
    draft.diagnosis = "Sample haemodynamic assessment";
    draft.otherComments = "All ten clinical questions populated; synthetic measurements for software testing only.";
    draft.summary = "Full sample HD dataset completed, including question notes and core measurements.";
    draft.reflection = "Review each question and measurement with the sample trainer.";
    return;
  }

  const procedureSequence: VascularProcedure[] = [
    "cvc", "cvc", "cvc", "cvc", "cvc",
    "picc_midline", "picc_midline", "picc_midline",
    "peripheral_access", "peripheral_access",
  ];
  draft.procedureCategory = procedureSequence[index] ?? VASCULAR_PROCEDURES[(index - 10) % VASCULAR_PROCEDURES.length][0];
  draft.procedure = "Ultrasound-guided vascular access; synthetic training entry.";
  draft.insertionSite = draft.procedureCategory === "cvc"
    ? ["Right internal jugular", "Left internal jugular", "Femoral vein"][index % 3]
    : draft.procedureCategory === "picc_midline"
      ? ["Right basilic vein", "Left basilic vein", "Brachial vein"][index % 3]
      : ["Forearm vein", "Radial artery", "Peripheral vein"][index % 3];
  draft.lineType = draft.procedureCategory === "cvc"
    ? "Central venous catheter"
    : draft.procedureCategory === "picc_midline" ? "PICC / midline" : "Peripheral cannula";
  draft.piccMidlineSubstitution = index === 9;
  for (const [assessmentIndex, [key]] of VASCULAR_ASSESSMENTS.entries()) {
    draft.assessments[key] = assessmentFor(index, assessmentIndex);
  }
  draft.diagnosis = "Ultrasound-guided vascular access sample";
  draft.otherComments = "Procedure, views, needle-tip visibility, and sterility documented; synthetic sample data.";
  draft.summary = "Full vascular access reporting fields populated for sample review.";
  draft.reflection = "Review the technique and stored views with the sample trainer.";
}

function createFullSampleCase(pathway: Pathway, index: number, total: number, now: Date): LogbookCase {
  const draft = createDraft(pathway);
  const supervisedTarget = PATHWAYS[pathway].supervisedTarget;
  draft.id = `pocus-sample:full:${pathway}:${String(index + 1).padStart(3, "0")}`;
  draft.date = dateWithinTrainingWindow(index, total, now);
  draft.caseType = index === 0 && pathway !== "vascular" ? "healthy_volunteer" : "clinical";
  draft.supervised = pathway === "vascular"
    ? [0, 1, 2, 5, 8, 12, 18].includes(index)
    : index < supervisedTarget;
  draft.supervisorName = draft.supervised ? "Sample trainer" : "";
  draft.indication = `Synthetic ${PATHWAYS[pathway].label} assessment`;
  draft.diagnosis = `Sample case ${index + 1}; not for clinical use`;
  draft.impressionCategory = pathway === "hd"
    ? index < 8 ? "normal" : index % 3 === 0 ? "indeterminate" : "abnormal"
    : pathway === "dvt" && index % 4 === 1 ? "abnormal" : ["abnormal", "indeterminate", "abnormal", "normal"][index % 4] as CaseDraft["impressionCategory"];
  draft.managementImpact = index % 3 === 0 ? "changed" : "unchanged";
  draft.imageQuality = IMAGE_QUALITIES[index % IMAGE_QUALITIES.length];
  populateStructuredFields(draft, index);
  if (pathway !== "dvt" && pathway !== "hd" && pathway !== "vascular") {
    draft.diagnosis = `Sample ${pathway} case ${index + 1}; not for clinical use`;
  }
  return addTimestamps(draft);
}

export function createAdminSampleCases(pathway: Pathway, now = new Date()): LogbookCase[] {
  const total = PATHWAYS[pathway].totalTarget;
  return Array.from({ length: total }, (_, index) => createFullSampleCase(pathway, index, total, now));
}

export function createFullAdminSampleCases(now = new Date()): LogbookCase[] {
  const pathways: Pathway[] = ["heart", "lung", "abdomen", "dvt", "hd", "vascular"];
  return pathways.flatMap((pathway) => createAdminSampleCases(pathway, now));
}
