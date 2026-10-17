import { getCaseSequenceNumbers } from "./case-display";
import {
  HEART_FINDINGS,
  LUNG_FINDINGS,
  LUNG_REGIONS,
  DVT_SITES,
  DVT_SITE_FINDINGS,
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
    ? ["Ventilatory support", "Regions scanned", ...LUNG_REGIONS.flatMap((region) => LUNG_FINDINGS.map(([, label]) => `${region} · ${label}`))]
    : pathway === "heart" ? ["Ventilatory support", "Views obtained", "Cardiovascular support", "Heart rate", "Blood pressure", "Central venous pressure", ...HEART_FINDINGS.map(([, label]) => label)] : pathway === "abdomen" ? ["Examination points attempted", "RUQ · diaphragm and liver", "LUQ · diaphragm and spleen", "Right kidney", "Right hydronephrosis", "Left kidney", "Left hydronephrosis", "Bladder size", "Bladder description", "Free fluid", "Other comments"] : DVT_SITES.flatMap((site) => DVT_SITE_FINDINGS.map(([, label]) => `${site} · ${label}`)).concat("Other comments");
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
            entry.ventilatorySupport.trim(),
            entry.regions.join("; "),
            ...LUNG_REGIONS.flatMap((region) => LUNG_FINDINGS.map(([key]) => assessment(entry.findings[region][key]))),
          ]
        : entry.pathway === "heart" ? [
            entry.ventilatorySupport.trim(),
            entry.views.join("; "),
            entry.cardiovascularSupport.trim(),
            entry.heartRate.trim(),
            entry.bloodPressure.trim(),
            entry.centralVenousPressure.trim(),
            ...HEART_FINDINGS.map(([key]) => assessment(entry.findings[key])),
          ] : entry.pathway === "abdomen" ? [entry.examinationPoints.join("; "), entry.rightUpperQuadrant, entry.leftUpperQuadrant, entry.rightKidney, entry.rightHydronephrosis, entry.leftKidney, entry.leftHydronephrosis, entry.bladderSize, entry.bladderDescription, entry.freeFluid, entry.otherComments] : [
            ...DVT_SITES.flatMap((site) => DVT_SITE_FINDINGS.map(([key]) => assessment(entry.findings[site][key]))),
            entry.otherComments.trim(),
          ];
      return [...common, ...details, entry.summary.trim(), entry.reflection.trim()];
    });

  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function csvFilename(pathway: Pathway, now = new Date()) {
  const date = now.toISOString().slice(0, 10);
  return `pocus-${PATHWAYS[pathway].label.replace(/^FUSIC\s+/, "").toLowerCase()}-logbook-${date}.csv`;
}
