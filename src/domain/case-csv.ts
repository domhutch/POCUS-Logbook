import { getCaseSequenceNumbers } from "./case-display";
import {
  HEART_FINDINGS,
  LUNG_FINDINGS,
  LUNG_REGIONS,
  DVT_SITES,
  DVT_SITE_FINDINGS,
  HD_QUESTIONS,
  HD_MEASUREMENTS,
  VASCULAR_ASSESSMENTS,
  VASCULAR_PROCEDURES,
  PATHWAYS,
  isSampleCase,
  type LogbookCase,
  type Pathway,
} from "./logbook";

function csvCell(value: string | number | boolean) {
  const text = String(value);
  // Prevent spreadsheet programs from interpreting case text as a formula.
  const safeText = /^[\u0000-\u0020]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

function assessment(value: string) {
  return value === "not_assessed" ? "Not assessed" : value === "unable" ? "Unable to assess" : value === "yes" ? "Yes" : "No";
}

function commonColumns() {
  return [
    "Case number",
    "Scan date",
    "Case type",
    "Sample data",
    "Directly supervised",
    "Supervisor",
    "Indication",
    "Diagnosis",
    "Impression",
    "Management impact",
    "Image quality",
  ];
}

export function createCasesCsv(cases: LogbookCase[], pathway: Pathway) {
  const pathwayCases = cases.filter((entry) => entry.pathway === pathway);
  const sequenceNumbers = getCaseSequenceNumbers(pathwayCases);
  const detailColumns = pathway === "lung"
    ? ["Age (years)", "Gender", "BMI", "Ventilatory support", "Regions scanned", ...LUNG_REGIONS.flatMap((region) => LUNG_FINDINGS.map(([, label]) => `${region} · ${label}`))]
    : pathway === "heart" ? ["Age (years)", "Gender", "BMI", "Operator", "Ventilatory support", "Views obtained", "Cardiovascular support", "Heart rate", "Blood pressure", "Central venous pressure", ...HEART_FINDINGS.map(([, label]) => label)] : pathway === "abdomen" ? ["Examination points attempted", "RUQ · diaphragm and liver", "LUQ · diaphragm and spleen", "Right kidney", "Right hydronephrosis", "Left kidney", "Left hydronephrosis", "Bladder size", "Bladder description", "Free fluid", "Other comments"] : pathway === "dvt" ? DVT_SITES.flatMap((site) => DVT_SITE_FINDINGS.map(([, label]) => `${site} · ${label}`)).concat("Other comments") : pathway === "hd" ? [...HD_QUESTIONS.flatMap(([, label]) => [`${label} · Finding`, `${label} · Notes`]), ...HD_MEASUREMENTS.map(([, label]) => label), "Other comments"] : ["Procedure category", "Procedure", "Site of insertion", "Type of line", "PICC/midline quota substitution", ...VASCULAR_ASSESSMENTS.map(([, label]) => label), "Comments"];
  const headers = [...commonColumns(), ...detailColumns, "Summary of main findings", "Reflection"];

  const rows = pathwayCases
    .slice()
    .sort((a, b) => sequenceNumbers.get(a.id)! - sequenceNumbers.get(b.id)!)
    .map((entry) => {
      const common = [
        sequenceNumbers.get(entry.id)!,
        entry.date,
        entry.caseType === "healthy_volunteer" ? "Healthy volunteer" : "Clinical scan",
        isSampleCase(entry) ? "Yes" : "No",
        entry.supervised ? "Yes" : "No",
        entry.supervisorName.trim(),
        entry.indication.trim(),
        entry.diagnosis.trim(),
        entry.impressionCategory === "not_recorded" ? "Not recorded" : entry.impressionCategory,
        entry.managementImpact === "not_recorded" ? "Not recorded" : entry.managementImpact,
        entry.imageQuality === "not_recorded" ? "Not recorded" : entry.imageQuality,
      ];
      const details = entry.pathway === "lung"
        ? [
            entry.patientAge.trim(),
            entry.patientGender.trim(),
            entry.patientBmi.trim(),
            entry.ventilatorySupport.trim(),
            entry.regions.join("; "),
            ...LUNG_REGIONS.flatMap((region) => LUNG_FINDINGS.map(([key]) => assessment(entry.findings[region][key]))),
          ]
        : entry.pathway === "heart" ? [
            entry.patientAge.trim(),
            entry.patientGender.trim(),
            entry.patientBmi.trim(),
            entry.operatorName.trim(),
            entry.ventilatorySupport.trim(),
            entry.views.join("; "),
            entry.cardiovascularSupport.trim(),
            entry.heartRate.trim(),
            entry.bloodPressure.trim(),
            entry.centralVenousPressure.trim(),
            ...HEART_FINDINGS.map(([key]) => assessment(entry.findings[key])),
          ] : entry.pathway === "abdomen" ? [entry.examinationPoints.join("; "), entry.rightUpperQuadrant, entry.leftUpperQuadrant, entry.rightKidney, entry.rightHydronephrosis, entry.leftKidney, entry.leftHydronephrosis, entry.bladderSize, entry.bladderDescription, entry.freeFluid, entry.otherComments] : entry.pathway === "dvt" ? [
            ...DVT_SITES.flatMap((site) => DVT_SITE_FINDINGS.map(([key]) => assessment(entry.findings[site][key]))),
            entry.otherComments.trim(),
          ] : entry.pathway === "hd" ? [
            ...HD_QUESTIONS.flatMap(([key]) => [assessment(entry.questionFindings[key]), entry.questionNotes[key].trim()]),
            ...HD_MEASUREMENTS.map(([key]) => entry.measurements[key].trim()),
            entry.otherComments.trim(),
          ] : [VASCULAR_PROCEDURES.find(([key]) => key === entry.procedureCategory)?.[1] ?? entry.procedureCategory, entry.procedure.trim(), entry.insertionSite.trim(), entry.lineType.trim(), entry.piccMidlineSubstitution ? "Yes" : "No", ...VASCULAR_ASSESSMENTS.map(([key]) => assessment(entry.assessments[key])), entry.otherComments.trim()];
      return [...common, ...details, entry.summary.trim(), entry.reflection.trim()];
    });

  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function csvFilename(pathway: Pathway, now = new Date()) {
  const date = now.toISOString().slice(0, 10);
  return `pocus-${PATHWAYS[pathway].label.toLowerCase()}-logbook-${date}.csv`;
}
