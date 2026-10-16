import {
  HEART_VIEWS,
  HEART_FINDINGS,
  LUNG_FINDINGS,
  LUNG_REGIONS,
  type CaseDraft,
  type ImageQuality,
  type ImpressionCategory,
  type LogbookCase,
  type ManagementImpact,
  type Pathway,
  SAMPLE_CASE_ID_PREFIX,
} from "./logbook";
import { addTimestamps, createDraft } from "./logbook";
import { PATHWAY_REQUIREMENTS } from "./pathway-requirements";

const ACTIVITY_MONTHS = 6;
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
  pathologyRangeRequired: boolean;
  protocolCoverage: string | null;
  scanTypeQuotas: Array<{
    scanType: string;
    minimumScans: number;
    minimumDirectlySupervised: number;
    note?: string;
  }>;
}

export function summarizeTrainingProgress(
  cases: LogbookCase[],
  pathway: Pathway,
): TrainingProgress {
  const pathwayCases = cases.filter((entry) => entry.pathway === pathway);
  const requirements = PATHWAY_REQUIREMENTS[pathway];
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
  const requirements = PATHWAY_REQUIREMENTS[pathway];
  const scanTypeQuotas = requirements.scanTypeQuotas;
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
    pathologyRangeRequired: requirements.caseMix.pathologyRangeRequired,
    protocolCoverage: requirements.protocolCoverage ?? null,
    scanTypeQuotas: scanTypeQuotas?.map((quota) => ({ ...quota })) ?? [],
  };
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short" });
}

function recentMonths(now: Date) {
  return Array.from({ length: ACTIVITY_MONTHS }, (_, index) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (ACTIVITY_MONTHS - index - 1), 1);
    return { key: monthKey(month), label: monthLabel(month) };
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
  draft.caseType = index % 5 === 0 ? "healthy_volunteer" : "clinical";
  draft.supervised = index % 3 !== 0;
  draft.indication =
    pathway === "lung"
      ? [
          "Breathlessness",
          "Hypoxia",
          "Pleural assessment",
          "Ventilatory support review",
        ][index % 4]
      : [
          "Hypotension",
          "Shock assessment",
          "Fluid status review",
          "Breathlessness",
        ][index % 4];
  draft.diagnosis =
    pathway === "lung"
      ? [
          "No significant abnormality",
          "Increased B-lines",
          "Small pleural effusion",
          "Indeterminate study",
        ][index % 4]
      : [
          "No significant abnormality",
          "Reduced LV function",
          "RV dilatation",
          "Indeterminate study",
        ][index % 4];
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
  } else {
    draft.views = HEART_VIEWS.filter(
      (_, viewIndex) => (viewIndex + index) % 3 !== 0,
    );
    if (index % 3 === 0) draft.findings.lvSignificantlyImpaired = "yes";
    if (index % 4 === 2) draft.findings.rvDilated = "yes";
    if (index % 5 === 3) draft.findings.pericardialFluid = "yes";
    draft.heartRate = String(68 + (index % 7) * 4);
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
): CaseMetrics {
  const pathwayCases = cases.filter((entry) => entry.pathway === pathway);
  const activityMonths = recentMonths(now);
  const activityCounts = pathwayCases.reduce<Record<string, number>>(
    (counts, entry) => {
      const key = entry.date.slice(0, 7);
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    },
    {},
  );

  const scanDetails =
    pathway === "lung"
      ? LUNG_REGIONS.map((region) => ({
          label: region,
          count: pathwayCases.filter(
            (entry) => entry.pathway === "lung" && entry.regions.includes(region),
          ).length,
        }))
      : HEART_VIEWS.map((view) => ({
          label: view,
          count: pathwayCases.filter(
            (entry) => entry.pathway === "heart" && entry.views.includes(view),
          ).length,
        }));
  const findings =
    pathway === "lung"
      ? LUNG_FINDINGS.map(([key, label]) => ({
          label,
          count: pathwayCases.filter(
            (entry) =>
              entry.pathway === "lung" &&
              LUNG_REGIONS.some((region) => entry.findings[region][key] === "yes"),
          ).length,
        }))
      : HEART_FINDINGS.map(([key, label]) => ({
          label,
          count: pathwayCases.filter(
            (entry) => entry.pathway === "heart" && entry.findings[key] === "yes",
          ).length,
        }));

  return {
    totalCases: pathwayCases.length,
    monthlyActivity: activityMonths.map((month) => ({
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
