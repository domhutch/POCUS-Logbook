import {
  HEART_VIEWS,
  LUNG_REGIONS,
  DVT_SITES,
  HD_QUESTIONS,
  type CaseDraft,
  type ImageQuality,
  type ImpressionCategory,
  type LogbookCase,
  type ManagementImpact,
  type Pathway,
  SAMPLE_CASE_ID_PREFIX,
} from "./logbook";
import { addTimestamps, createDraft } from "./logbook";
import { getDefaultCurriculumProfile } from "./pathway-requirements";
import { pathwayMetrics } from "../pathways/metrics";
import { pathwayCaseMixMetrics } from "../pathways/caseMixMetrics";

const sampleCasesPerMonth = [2, 3, 4, 2, 5, 3];
const imageQualities: ImageQuality[] = [
  "good",
  "acceptable",
  "good",
  "poor",
  "not_recorded",
];
const impressions: ImpressionCategory[] = [
  "normal",
  "abnormal",
  "not_recorded",
  "indeterminate",
];
const managementImpacts: ManagementImpact[] = [
  "unchanged",
  "changed",
  "not_recorded",
];

export interface MetricCount {
  label: string;
  count: number;
}

export interface MonthlyActivity extends MetricCount {
  key: string;
}

export type MetricsPeriod = "rolling_12_months" | "calendar_year";

export interface CaseMetrics {
  totalCases: number;
  monthlyActivity: MonthlyActivity[];
  scanDetails: MetricCount[];
  findings: MetricCount[];
  imageQuality: MetricCount[];
  impressions: MetricCount[];
  managementImpact: MetricCount[];
}

export interface TrainingProgress {
  totalCases: number;
  supervisedCases: number;
  totalTarget: number;
  supervisedTarget: number;
  totalTargetMet: boolean;
  supervisedTargetMet: boolean;
}

export interface CaseMixSummary {
  clinicalCases: number;
  healthyVolunteerCases: number;
  healthyVolunteerPercent: number;
  healthyVolunteerMaximumPercent: number | null;
  normalScans: number;
  normalScanMaximum: number | null;
  pathologyRangeRequired: boolean;
  protocolCoverage: string | null;
  scanTypeQuotas: Array<{
    scanType: string;
    minimumScans: number;
    minimumDirectlySupervised: number;
    recordedScans: number;
    supervisedScans: number;
    note?: string;
  }>;
  minimumPositiveScans: number | null;
  positiveScans: number | null;
}

export function summarizeTrainingProgress(
  cases: LogbookCase[],
  pathway: Pathway,
): TrainingProgress {
  const pathwayCases = cases.filter((entry) => entry.pathway === pathway);
  const requirements = getDefaultCurriculumProfile(pathway);
  const supervisedCases = pathwayCases.filter((entry) => entry.supervised).length;

  return {
    totalCases: pathwayCases.length,
    supervisedCases,
    totalTarget: requirements.totalScans,
    supervisedTarget: requirements.directlySupervisedScans,
    totalTargetMet: pathwayCases.length >= requirements.totalScans,
    supervisedTargetMet: supervisedCases >= requirements.directlySupervisedScans,
  };
}

export function summarizeCaseMix(
  cases: LogbookCase[],
  pathway: Pathway,
): CaseMixSummary {
  const pathwayCases = cases.filter((entry) => entry.pathway === pathway);
  const requirements = getDefaultCurriculumProfile(pathway);
  const scanTypeQuotas = requirements.scanTypeQuotas;
  const pathwayMixMetrics = pathwayCaseMixMetrics(pathwayCases, pathway, scanTypeQuotas ?? []);
  const healthyVolunteerCases = pathwayCases.filter(
    (entry) => entry.caseType === "healthy_volunteer",
  ).length;

  return {
    clinicalCases: pathwayCases.length - healthyVolunteerCases,
    healthyVolunteerCases,
    healthyVolunteerPercent:
      pathwayCases.length === 0
        ? 0
        : (healthyVolunteerCases / pathwayCases.length) * 100,
    healthyVolunteerMaximumPercent:
      requirements.caseMix.healthyVolunteerMaximumPercent ?? null,
    normalScans: pathwayCases.filter((entry) => entry.impressionCategory === "normal").length,
    normalScanMaximum: requirements.caseMix.normalScanMaximum ?? null,
    pathologyRangeRequired: requirements.caseMix.pathologyRangeRequired,
    protocolCoverage: requirements.protocolCoverage ?? null,
    scanTypeQuotas: pathwayMixMetrics.scanTypeQuotas,
    minimumPositiveScans: requirements.caseMix.minimumPositiveScans ?? null,
    positiveScans: pathwayMixMetrics.positiveScans,
  };
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date, includeYear: boolean) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    ...(includeYear ? { year: "2-digit" as const } : {}),
  });
}

function activityMonths(now: Date, period?: MetricsPeriod) {
  const length = period === "calendar_year"
    ? now.getMonth() + 1
    : period === "rolling_12_months"
      ? 12
      : 6;
  const startMonth = period === "calendar_year"
    ? 0
    : now.getMonth() - length + 1;
  return Array.from({ length }, (_, index) => {
    const month = new Date(now.getFullYear(), startMonth + index, 1);
    return {
      key: monthKey(month),
      label: monthLabel(month, period === "rolling_12_months"),
    };
  });
}

function countsFor<T extends string>(
  values: T[],
  labels: Record<T, string>,
): MetricCount[] {
  return (Object.keys(labels) as T[]).map((value) => ({
    label: labels[value],
    count: values.filter((entry) => entry === value).length,
  }));
}

function createSampleDraft(pathway: Pathway, index: number): CaseDraft {
  const draft = createDraft(pathway);
  draft.caseType = index === 0 ? "healthy_volunteer" : "clinical";
  draft.supervised = index % 3 !== 0;
  draft.indication =
    pathway === "lung"
      ? [
          "Breathlessness",
          "Hypoxia",
          "Pleural assessment",
          "Ventilatory support review",
        ][index % 4]
      : pathway === "heart" ? [
          "Hypotension",
          "Shock assessment",
          "Fluid status review",
          "Breathlessness",
        ][index % 4] : pathway === "abdomen" ? ["Abdominal assessment", "Free fluid assessment", "Renal assessment", "Bladder assessment"][index % 4] : pathway === "dvt" ? ["Leg swelling", "DVT assessment", "Venous assessment", "Thrombosis assessment"][index % 4] : ["Haemodynamic assessment", "Shock assessment", "Fluid responsiveness", "Venous congestion"][index % 4];
  draft.diagnosis =
    pathway === "lung"
      ? [
          "No significant abnormality",
          "Increased B-lines",
          "Small pleural effusion",
          "Indeterminate study",
        ][index % 4]
      : pathway === "heart" ? [
          "No significant abnormality",
          "Reduced LV function",
          "RV dilatation",
          "Indeterminate study",
        ][index % 4] : pathway === "abdomen" ? ["No significant abnormality", "Free fluid noted", "Indeterminate study", "Renal finding recorded"][index % 4] : pathway === "dvt" ? ["No DVT demonstrated", "Positive DVT finding", "Indeterminate study", "Venous findings recorded"][index % 4] : ["No significant abnormality", "Reduced LV function", "Raised filling pressure", "Indeterminate study"][index % 4];
  draft.imageQuality = imageQualities[index % imageQualities.length];
  draft.impressionCategory = impressions[index % impressions.length];
  draft.managementImpact = managementImpacts[index % managementImpacts.length];

  if (draft.pathway === "lung") {
    draft.regions = LUNG_REGIONS.filter(
      (_, regionIndex) => (regionIndex + index) % 3 !== 0,
    );
    for (const region of LUNG_REGIONS) {
      if ((LUNG_REGIONS.indexOf(region) + index) % 4 === 0) {
        draft.findings[region].bLines = "yes";
      }
      if (index % 4 === 2) draft.findings[region].pleuralEffusion = "yes";
      if (index % 5 === 3) draft.findings[region].consolidation = "yes";
    }
    draft.summary = "Sample case for exploring logbook metrics.";
  } else if (draft.pathway === "heart") {
    draft.views = HEART_VIEWS.filter(
      (_, viewIndex) => (viewIndex + index) % 3 !== 0,
    );
    if (index % 3 === 0) draft.findings.lvSignificantlyImpaired = "yes";
    if (index % 4 === 2) draft.findings.rvDilated = "yes";
    if (index % 5 === 3) draft.findings.pericardialFluid = "yes";
    draft.heartRate = String(68 + (index % 7) * 4);
    draft.summary = "Sample case for exploring logbook metrics.";
  } else if (draft.pathway === "abdomen") {
    draft.examinationPoints = ["RUQ (diaphragm and liver)", "Right kidney", "Pelvis (bladder)"];
    draft.rightUpperQuadrant = index % 2 ? "No free fluid seen" : "Liver visualised";
    draft.rightHydronephrosis = "none";
    draft.bladderSize = "normal";
    draft.summary = "Sample case for exploring logbook metrics.";
  } else if (draft.pathway === "dvt") {
    const site = DVT_SITES[index % DVT_SITES.length];
    draft.findings[site].fullyCompressible = "yes";
    if (index % 3 === 1) draft.findings[site].occlusiveThrombus = "yes";
    else draft.findings[site].occlusiveThrombus = "no";
    draft.summary = "Sample case for exploring logbook metrics.";
  } else if (draft.pathway === "hd") {
    const [question] = HD_QUESTIONS[index % HD_QUESTIONS.length];
    draft.questionFindings[question] = index % 3 === 1 ? "yes" : "no";
    if (index % 3 === 1) draft.questionNotes[question] = "Sample finding";
    draft.measurements.lvEjectionFraction = String(55 + (index % 5) * 5);
    draft.measurements.rvFac = String(28 + (index % 4) * 4);
    draft.summary = "Sample case for exploring logbook metrics.";
  } else {
    draft.procedureCategory = (["cvc", "picc_midline", "peripheral_access"] as const)[index % 3];
    draft.procedure = "Ultrasound-guided vascular access";
    draft.insertionSite = ["Internal jugular", "Upper arm vein", "Peripheral vein"][index % 3];
    draft.assessments.arteryVeinDistinguished = "yes";
    draft.assessments.transverseView = "yes";
    draft.assessments.longitudinalView = "yes";
    draft.assessments.needleTipVisible = "yes";
    draft.assessments.sterilityMaintained = "yes";
    draft.summary = "Sample case for exploring logbook metrics.";
  }

  return draft;
}

export function createSampleCases(pathway: Pathway, now = new Date()) {
  const cases: LogbookCase[] = [];
  let index = 0;

  sampleCasesPerMonth.forEach((count, monthOffset) => {
    for (let monthCase = 0; monthCase < count; monthCase += 1) {
      const scanDate = new Date(
        now.getFullYear(),
        now.getMonth() - (sampleCasesPerMonth.length - monthOffset - 1),
        3 + monthCase * 5,
      );
      const draft = createSampleDraft(pathway, index);
      draft.id = `${SAMPLE_CASE_ID_PREFIX}${pathway}:${String(index + 1).padStart(2, "0")}`;
      draft.date = `${scanDate.getFullYear()}-${String(
        scanDate.getMonth() + 1,
      ).padStart(2, "0")}-${String(scanDate.getDate()).padStart(2, "0")}`;
      cases.push(addTimestamps(draft));
      index += 1;
    }
  });

  return cases;
}

export function summarizeCases(
  cases: LogbookCase[],
  pathway: Pathway,
  now = new Date(),
  period?: MetricsPeriod,
): CaseMetrics {
  const pathwayCases = cases.filter((entry) => entry.pathway === pathway);
  const months = activityMonths(now, period);
  const activityCounts = pathwayCases.reduce<Record<string, number>>(
    (counts, entry) => {
      const key = entry.date.slice(0, 7);
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    },
    {},
  );

  const { scanDetails, findings } = pathwayMetrics(pathwayCases, pathway);
  return {
    totalCases: pathwayCases.length,
    monthlyActivity: months.map((month) => ({
      ...month,
      count: activityCounts[month.key] ?? 0,
    })),
    scanDetails,
    findings,
    imageQuality: countsFor(
      pathwayCases.map((entry) => entry.imageQuality),
      {
        not_recorded: "Not recorded",
        good: "Good",
        acceptable: "Acceptable",
        poor: "Poor",
      },
    ),
    impressions: countsFor(
      pathwayCases.map((entry) => entry.impressionCategory),
      {
        not_recorded: "Not recorded",
        normal: "Normal",
        abnormal: "Abnormal / pathology",
        indeterminate: "Indeterminate",
      },
    ),
    managementImpact: countsFor(
      pathwayCases.map((entry) => entry.managementImpact),
      {
        not_recorded: "Not recorded",
        changed: "Changed",
        unchanged: "Unchanged",
      },
    ),
  };
}
