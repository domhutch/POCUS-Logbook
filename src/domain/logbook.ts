import { getDefaultCurriculumProfile } from "./pathway-requirements";

export type Pathway = "lung" | "heart" | "abdomen" | "dvt" | "hd" | "vascular";

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
    label: "Heart",
    description:
      "Record a focused cardiac scan, review your cases and keep your own practice history.",
    icon: "H",
    totalTarget: getDefaultCurriculumProfile("heart").totalScans,
    supervisedTarget: getDefaultCurriculumProfile("heart").directlySupervisedScans,
    source: `${getDefaultCurriculumProfile("heart").source.title} ${getDefaultCurriculumProfile("heart").source.version}`,
  },
  lung: {
    label: "Lung",
    description:
      "Record a lung ultrasound scan, review your cases and keep your own practice history.",
    icon: "L",
    totalTarget: getDefaultCurriculumProfile("lung").totalScans,
    supervisedTarget: getDefaultCurriculumProfile("lung").directlySupervisedScans,
    source: `${getDefaultCurriculumProfile("lung").source.title} ${getDefaultCurriculumProfile("lung").source.version}`,
  },
  abdomen: {
    label: "Abdomen",
    description: "Record a focused abdominal ultrasound scan and review your cases.",
    icon: "A",
    totalTarget: getDefaultCurriculumProfile("abdomen").totalScans,
    supervisedTarget: getDefaultCurriculumProfile("abdomen").directlySupervisedScans,
    source: `${getDefaultCurriculumProfile("abdomen").source.title} ${getDefaultCurriculumProfile("abdomen").source.version}`,
  },
  dvt: {
    label: "DVT",
    description: "Record a focused DVT ultrasound scan and review your cases.",
    icon: "D",
    totalTarget: getDefaultCurriculumProfile("dvt").totalScans,
    supervisedTarget: getDefaultCurriculumProfile("dvt").directlySupervisedScans,
    source: `${getDefaultCurriculumProfile("dvt").source.title} ${getDefaultCurriculumProfile("dvt").source.version}`,
  },
  hd: {
    label: "HD",
    description: "Record a focused haemodynamic ultrasound study and review your cases.",
    icon: "HD",
    totalTarget: getDefaultCurriculumProfile("hd").totalScans,
    supervisedTarget: getDefaultCurriculumProfile("hd").directlySupervisedScans,
    source: `${getDefaultCurriculumProfile("hd").source.title} ${getDefaultCurriculumProfile("hd").source.version}`,
  },
  vascular: {
    label: "Vascular",
    description: "Record vascular access ultrasound and review your cases.",
    icon: "V",
    totalTarget: getDefaultCurriculumProfile("vascular").totalScans,
    supervisedTarget: getDefaultCurriculumProfile("vascular").directlySupervisedScans,
    source: `${getDefaultCurriculumProfile("vascular").source.title} ${getDefaultCurriculumProfile("vascular").source.version}`,
  },
} as const;

export const VASCULAR_PROCEDURES = [
  ["cvc", "Central venous catheter (internal jugular ± femoral)"],
  ["picc_midline", "PICC or midline"],
  ["peripheral_access", "Peripheral vascular access"],
] as const;
export type VascularProcedure = (typeof VASCULAR_PROCEDURES)[number][0];
export const VASCULAR_ASSESSMENTS = [
  ["arteryVeinDistinguished", "Artery and vein distinguished / confirmed"],
  ["transverseView", "Transverse view obtained"],
  ["longitudinalView", "Longitudinal view obtained"],
  ["needleTipVisible", "Needle tip kept in view"],
  ["sterilityMaintained", "Sterility maintained"],
] as const;
export type VascularAssessment = (typeof VASCULAR_ASSESSMENTS)[number][0];

export const HD_QUESTIONS = [
  ["strokeVolumeCoupling", "Is stroke volume and/or ventricular–arterial coupling abnormal?"],
  ["strokeVolumeResponsiveness", "Is stroke volume responsive to fluids, vasopressors or inotropes?"],
  ["aorta", "Is the aorta abnormal?"],
  ["valves", "Are the aortic, mitral or tricuspid valves severely abnormal?"],
  ["lvOutflowObstruction", "Is there LV outflow tract obstruction (LVOTO)?"],
  ["regionalWallMotion", "Is there a regional wall motion abnormality (RWMA)?"],
  ["leftAtrialPressure", "Is left atrial pressure raised?"],
  ["pulmonaryPressure", "Is pulmonary artery pressure raised, and how is the RV responding?"],
  ["tamponade", "Are there ultrasound features of cardiac tamponade?"],
  ["venousCongestion", "Is there venous congestion?"],
] as const;
export type HdQuestion = (typeof HD_QUESTIONS)[number][0];

export const HD_MEASUREMENTS = [
  ["lvEjectionFraction", "LVEF (%)"],
  ["lvotVti", "LVOT VTI (cm)"],
  ["strokeVolume", "Stroke volume (mL)"],
  ["aorticRoot", "Aortic root (mm)"],
  ["ascendingAorta", "Ascending aorta (mm)"],
  ["rvFac", "RV fractional area change (%)"],
  ["rvBasalDiameter", "RV basal diameter (mm)"],
  ["rvMidDiameter", "RV mid diameter (mm)"],
  ["rvLongitudinalDiameter", "RV longitudinal diameter (mm)"],
  ["trVmax", "TR Vmax (m/s)"],
  ["leftAtrialPressureAssessment", "Left atrial pressure algorithm result"],
  ["pulmonaryDopplerAssessment", "Pulmonary hypertension Doppler assessment"],
  ["hepaticVeinFlow", "Hepatic vein flow pattern"],
  ["portalVeinPulsatilityIndex", "Portal vein pulsatility index"],
  ["renalVeinImpedanceIndex", "Renal vein venous impedance index"],
  ["renalArteryResistiveIndex", "Renal artery resistive index (RRI)"],
  ["vexusGrade", "VExUS grade"],
] as const;
export type HdMeasurement = (typeof HD_MEASUREMENTS)[number][0];

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
  patientAge: string;
  patientGender: string;
  patientBmi: string;
  ventilatorySupport: string;
  regions: LungRegion[];
  findings: Record<LungRegion, LungRegionFindings>;
}

export interface HeartCaseFields extends CaseFields {
  pathway: "heart";
  patientAge: string;
  patientGender: string;
  patientBmi: string;
  operatorName: string;
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
  patientAge: string;
  patientGender: string;
  patientBmi: string;
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

export interface HdCaseFields extends CaseFields {
  pathway: "hd";
  questionFindings: Record<HdQuestion, Assessment>;
  questionNotes: Record<HdQuestion, string>;
  measurements: Record<HdMeasurement, string>;
  otherComments: string;
}

export interface VascularCaseFields extends CaseFields {
  pathway: "vascular";
  procedureCategory: VascularProcedure;
  procedure: string;
  insertionSite: string;
  lineType: string;
  piccMidlineSubstitution: boolean;
  assessments: Record<VascularAssessment, Assessment>;
  otherComments: string;
}

export type LogbookCase = LungCaseFields | HeartCaseFields | AbdomenCaseFields | DvtCaseFields | HdCaseFields | VascularCaseFields;
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

function emptyHdRecord<T extends string>(keys: readonly T[], value = "") {
  return Object.fromEntries(keys.map((key) => [key, value])) as Record<T, typeof value>;
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
  if (pathway === "vascular") {
    return {
      ...newCaseFields(), pathway, procedureCategory: "cvc", procedure: "",
      insertionSite: "", lineType: "", piccMidlineSubstitution: false, assessments: emptyHdRecord(
        VASCULAR_ASSESSMENTS.map(([key]) => key), "not_assessed",
      ) as Record<VascularAssessment, Assessment>, otherComments: "",
    };
  }
  if (pathway === "lung") {
    return {
      ...newCaseFields(),
      pathway,
      patientAge: "",
      patientGender: "",
      patientBmi: "",
      ventilatorySupport: "Not recorded",
      regions: [],
      findings: emptyLungFindings(),
    };
  }

  if (pathway === "abdomen") {
    return {
      ...newCaseFields(), pathway, patientAge: "", patientGender: "", patientBmi: "", examinationPoints: [],
      rightUpperQuadrant: "", leftUpperQuadrant: "", rightKidney: "",
      rightHydronephrosis: "not_assessed", leftKidney: "",
      leftHydronephrosis: "not_assessed", bladderSize: "not_assessed",
      bladderDescription: "", freeFluid: "", otherComments: "",
    };
  }

  if (pathway === "dvt") {
    return { ...newCaseFields(), pathway, findings: emptyDvtFindings(), otherComments: "" };
  }

  if (pathway === "hd") {
    return {
      ...newCaseFields(),
      pathway,
      questionFindings: emptyHdRecord(HD_QUESTIONS.map(([key]) => key), "not_assessed") as Record<HdQuestion, Assessment>,
      questionNotes: emptyHdRecord(HD_QUESTIONS.map(([key]) => key)),
      measurements: emptyHdRecord(HD_MEASUREMENTS.map(([key]) => key)),
      otherComments: "",
    };
  }

  return {
    ...newCaseFields(),
    pathway,
    patientAge: "",
    patientGender: "",
    patientBmi: "",
    operatorName: "",
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
