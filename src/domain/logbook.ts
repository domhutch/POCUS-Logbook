export type Pathway = "lung" | "heart";

export type CaseType = "clinical" | "healthy_volunteer";
export type ImageQuality = "not_recorded" | "good" | "acceptable" | "poor";
export type Assessment = "not_assessed" | "yes" | "no" | "unable";

export const PATHWAYS = {
  lung: {
    label: "FUSIC Lung",
    description:
      "Record a lung ultrasound scan, review your cases and keep your own practice history.",
    icon: "L",
    totalTarget: 30,
    supervisedTarget: 10,
    source: "FUSIC Lung Training Pack v10 (2025)",
  },
  heart: {
    label: "FUSIC Heart",
    description:
      "Record a focused cardiac scan, review your cases and keep your own practice history.",
    icon: "H",
    totalTarget: 50,
    supervisedTarget: 10,
    source: "FUSIC Heart Training Pack v13 (2025)",
  },
} as const;

export const LUNG_REGIONS = [
  "Right upper anterior",
  "Right lower anterior",
  "Right posterolateral",
  "Left upper anterior",
  "Left lower anterior",
  "Left posterolateral",
] as const;

export type LungRegion = (typeof LUNG_REGIONS)[number];

export const LUNG_FINDINGS = [
  ["lungSliding", "Lung sliding"],
  ["bLines", "B-lines (>2)"],
  ["consolidation", "Consolidation"],
  ["pleuralEffusion", "Pleural effusion"],
] as const;

export type LungFinding = (typeof LUNG_FINDINGS)[number][0];

export const HEART_VIEWS = [
  "PLAX",
  "PSAX",
  "Apical 4-chamber",
  "Subcostal 4-chamber",
  "IVC",
] as const;

export type HeartView = (typeof HEART_VIEWS)[number];

export const HEART_FINDINGS = [
  ["lvDilated", "LV dilated"],
  ["lvSignificantlyImpaired", "LV significantly impaired"],
  ["rvDilated", "RV dilated"],
  ["rvSignificantlyImpaired", "RV significantly impaired"],
  ["lowPreload", "Evidence of low preload"],
  ["pericardialFluid", "Pericardial fluid"],
  ["pleuralFluid", "Pleural fluid"],
] as const;

export type HeartFinding = (typeof HEART_FINDINGS)[number][0];

export type LungRegionFindings = Record<LungFinding, Assessment>;

interface CaseFields {
  id: string;
  date: string;
  caseType: CaseType;
  supervised: boolean;
  supervisorName: string;
  indication: string;
  diagnosis: string;
  imageQuality: ImageQuality;
  summary: string;
  reflection: string;
  createdAt: string;
  updatedAt: string;
}

export interface LungCaseFields extends CaseFields {
  pathway: "lung";
  ventilatorySupport: string;
  regions: LungRegion[];
  findings: Record<LungRegion, LungRegionFindings>;
}

export interface HeartCaseFields extends CaseFields {
  pathway: "heart";
  ventilatorySupport: string;
  cardiovascularSupport: string;
  heartRate: string;
  bloodPressure: string;
  centralVenousPressure: string;
  views: HeartView[];
  findings: Record<HeartFinding, Assessment>;
}

export type LogbookCase = LungCaseFields | HeartCaseFields;
type WithoutTimestamps<T> = T extends LogbookCase
  ? Omit<T, "createdAt" | "updatedAt">
  : never;
export type CaseDraft = WithoutTimestamps<LogbookCase>;

function today() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function emptyLungFindings(): Record<LungRegion, LungRegionFindings> {
  return Object.fromEntries(
    LUNG_REGIONS.map((region) => [
      region,
      Object.fromEntries(
        LUNG_FINDINGS.map(([key]) => [key, "not_assessed"]),
      ),
    ]),
  ) as Record<LungRegion, LungRegionFindings>;
}

function emptyHeartFindings(): Record<HeartFinding, Assessment> {
  return Object.fromEntries(
    HEART_FINDINGS.map(([key]) => [key, "not_assessed"]),
  ) as Record<HeartFinding, Assessment>;
}

function newCaseFields() {
  return {
    id: crypto.randomUUID(),
    date: today(),
    caseType: "clinical" as const,
    supervised: false,
    supervisorName: "",
    indication: "",
    diagnosis: "",
    imageQuality: "not_recorded" as const,
    summary: "",
    reflection: "",
  };
}

export function createDraft(pathway: Pathway): CaseDraft {
  if (pathway === "lung") {
    return {
      ...newCaseFields(),
      pathway,
      ventilatorySupport: "Not recorded",
      regions: [],
      findings: emptyLungFindings(),
    };
  }

  return {
    ...newCaseFields(),
    pathway,
    ventilatorySupport: "Not recorded",
    cardiovascularSupport: "",
    heartRate: "",
    bloodPressure: "",
    centralVenousPressure: "",
    views: [],
    findings: emptyHeartFindings(),
  };
}

export function addTimestamps(
  draft: CaseDraft,
  existing?: LogbookCase,
): LogbookCase {
  const now = new Date().toISOString();
  return {
    ...draft,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}
