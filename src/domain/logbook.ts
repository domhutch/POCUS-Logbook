import { PATHWAY_REQUIREMENTS } from "./pathway-requirements";

export type Pathway = "lung" | "heart" | "abdomen" | "dvt";

export type CaseType = "clinical" | "healthy_volunteer";
export type ImageQuality = "not_recorded" | "good" | "acceptable" | "poor";
export type Assessment = "not_assessed" | "yes" | "no" | "unable";
export type ImpressionCategory =
  | "not_recorded"
  | "normal"
  | "abnormal"
  | "indeterminate";
export type ManagementImpact = "not_recorded" | "changed" | "unchanged";

export const PATHWAYS = {
  heart: {
    label: "FUSIC Heart",
    description:
      "Record a focused cardiac scan, review your cases and keep your own practice history.",
    icon: "H",
    totalTarget: PATHWAY_REQUIREMENTS.heart.totalScans,
    supervisedTarget: PATHWAY_REQUIREMENTS.heart.directlySupervisedScans,
    source: `${PATHWAY_REQUIREMENTS.heart.source.title} ${PATHWAY_REQUIREMENTS.heart.source.version}`,
  },
  lung: {
    label: "FUSIC Lung",
    description:
      "Record a lung ultrasound scan, review your cases and keep your own practice history.",
    icon: "L",
    totalTarget: PATHWAY_REQUIREMENTS.lung.totalScans,
    supervisedTarget: PATHWAY_REQUIREMENTS.lung.directlySupervisedScans,
    source: `${PATHWAY_REQUIREMENTS.lung.source.title} ${PATHWAY_REQUIREMENTS.lung.source.version}`,
  },
  abdomen: {
    label: "FUSIC Abdomen",
    description: "Record a focused abdominal ultrasound scan and review your cases.",
    icon: "A",
    totalTarget: PATHWAY_REQUIREMENTS.abdomen.totalScans,
    supervisedTarget: PATHWAY_REQUIREMENTS.abdomen.directlySupervisedScans,
    source: `${PATHWAY_REQUIREMENTS.abdomen.source.title} ${PATHWAY_REQUIREMENTS.abdomen.source.version}`,
  },
  dvt: {
    label: "FUSIC DVT",
    description: "Record a focused DVT ultrasound scan and review your cases.",
    icon: "D",
    totalTarget: PATHWAY_REQUIREMENTS.dvt.totalScans,
    supervisedTarget: PATHWAY_REQUIREMENTS.dvt.directlySupervisedScans,
    source: `${PATHWAY_REQUIREMENTS.dvt.source.title} ${PATHWAY_REQUIREMENTS.dvt.source.version}`,
  },
} as const;

export const ABDOMEN_EXAMINATION_POINTS = [
  "RUQ (diaphragm and liver)",
  "LUQ (diaphragm and spleen)",
  "Right kidney",
  "Left kidney",
  "Pelvis (bladder)",
  "RIF and LIF (ascites)",
] as const;
export type AbdomenExaminationPoint = (typeof ABDOMEN_EXAMINATION_POINTS)[number];
export type Hydronephrosis = "not_assessed" | "none" | "mild" | "moderate" | "severe";

export const DVT_SITES = [
  "External iliac",
  "Saphenofemoral junction",
  "Common femoral vein",
  "Common / deep femoral junction",
  "Femoral vein · mid-thigh",
  "Popliteal vein",
  "Popliteal trifurcation",
] as const;
export type DvtSite = (typeof DVT_SITES)[number];
export const DVT_SITE_FINDINGS = [
  ["fullyCompressible", "Veins fully compressible"],
  ["occlusiveThrombus", "Occlusive thrombus"],
  ["nonOcclusiveThrombus", "Non-occlusive thrombus"],
  ["notVisualised", "Not visualised"],
  ["flowAugmentation", "Flow augmentation"],
  ["respiratoryVariation", "Respiratory variation Doppler"],
] as const;
export type DvtSiteFinding = (typeof DVT_SITE_FINDINGS)[number][0];
export type DvtSiteFindings = Record<DvtSiteFinding, Assessment>;

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
  impressionCategory: ImpressionCategory;
  managementImpact: ManagementImpact;
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

export interface AbdomenCaseFields extends CaseFields {
  pathway: "abdomen";
  examinationPoints: AbdomenExaminationPoint[];
  rightUpperQuadrant: string;
  leftUpperQuadrant: string;
  rightKidney: string;
  rightHydronephrosis: Hydronephrosis;
  leftKidney: string;
  leftHydronephrosis: Hydronephrosis;
  bladderSize: "not_assessed" | "not_seen" | "small" | "normal" | "large";
  bladderDescription: string;
  freeFluid: string;
  otherComments: string;
}

export interface DvtCaseFields extends CaseFields {
  pathway: "dvt";
  findings: Record<DvtSite, DvtSiteFindings>;
  otherComments: string;
}

export type LogbookCase = LungCaseFields | HeartCaseFields | AbdomenCaseFields | DvtCaseFields;
export const SAMPLE_CASE_ID_PREFIX = "pocus-sample:";

export function isSampleCase(entry: Pick<LogbookCase, "id">) {
  return entry.id.startsWith(SAMPLE_CASE_ID_PREFIX);
}

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

function emptyDvtFindings(): Record<DvtSite, DvtSiteFindings> {
  return Object.fromEntries(
    DVT_SITES.map((site) => [site, Object.fromEntries(DVT_SITE_FINDINGS.map(([key]) => [key, "not_assessed"]))]),
  ) as Record<DvtSite, DvtSiteFindings>;
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
    impressionCategory: "not_recorded" as const,
    managementImpact: "not_recorded" as const,
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

  if (pathway === "abdomen") {
    return {
      ...newCaseFields(), pathway, examinationPoints: [],
      rightUpperQuadrant: "", leftUpperQuadrant: "", rightKidney: "",
      rightHydronephrosis: "not_assessed", leftKidney: "",
      leftHydronephrosis: "not_assessed", bladderSize: "not_assessed",
      bladderDescription: "", freeFluid: "", otherComments: "",
    };
  }

  if (pathway === "dvt") {
    return { ...newCaseFields(), pathway, findings: emptyDvtFindings(), otherComments: "" };
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
