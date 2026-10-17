import {
  HEART_FINDINGS,
  HEART_VIEWS,
  LUNG_FINDINGS,
  LUNG_REGIONS,
  type Assessment,
  type CaseType,
  type HeartFinding,
  type HeartView,
  type ImageQuality,
  type ImpressionCategory,
  type LogbookCase,
  type LungFinding,
  type LungRegion,
  type ManagementImpact,
  type Pathway,
  type HeartCaseFields,
  type LungCaseFields,
  DVT_SITES,
  DVT_SITE_FINDINGS,
  HD_QUESTIONS,
  HD_MEASUREMENTS,
  VASCULAR_PROCEDURES,
  VASCULAR_ASSESSMENTS,
  type DvtSite,
  type DvtSiteFinding,
  type HdQuestion,
  type HdMeasurement,
  type VascularProcedure,
  type VascularAssessment,
} from "./logbook";

export const BACKUP_SCHEMA_VERSION = 10;
export const BACKUP_APP_ID = "pocus-logbook";
const VERSION_ONE_BACKUP = 1;
const VERSION_TWO_BACKUP = 2;
const VERSION_THREE_BACKUP = 3;
const VERSION_FOUR_BACKUP = 4;
const VERSION_FIVE_BACKUP = 5;
const VERSION_SIX_BACKUP = 6;
const VERSION_SEVEN_BACKUP = 7;
const VERSION_EIGHT_BACKUP = 8;
const VERSION_NINE_BACKUP = 9;

export interface LogbookBackup {
  app: typeof BACKUP_APP_ID;
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  cases: LogbookCase[];
  pathwayModes: Record<Pathway, boolean>;
}

type VersionOneLogbookCase =
  | Omit<
      LungCaseFields,
      "impressionCategory" | "managementImpact"
    >
  | Omit<
      HeartCaseFields,
      "impressionCategory" | "managementImpact"
    >;
type VersionTwoLogbookCase =
  | (LungCaseFields & { curriculumPlus: boolean })
  | (HeartCaseFields & { curriculumPlus: boolean });

interface BackupEnvelope {
  app: typeof BACKUP_APP_ID;
  schemaVersion: number;
  exportedAt: string;
  cases: unknown[];
  pathwayModes: Record<string, boolean>;
}

const legacyCaseFields = [
  "id",
  "date",
  "caseType",
  "supervised",
  "supervisorName",
  "indication",
  "diagnosis",
  "imageQuality",
  "summary",
  "reflection",
  "createdAt",
  "updatedAt",
  "pathway",
] as const;

const caseFields = [
  ...legacyCaseFields.slice(0, 7),
  "impressionCategory",
  "managementImpact",
  ...legacyCaseFields.slice(7),
] as const;
const versionTwoCaseFields = [
  ...legacyCaseFields.slice(0, 7),
  "impressionCategory",
  "managementImpact",
  "curriculumPlus",
  ...legacyCaseFields.slice(7),
] as const;
const lungCaseFields = [
  ...caseFields,
  "patientAge",
  "patientGender",
  "patientBmi",
  "ventilatorySupport",
  "regions",
  "findings",
];
const versionEightLungCaseFields = [
  ...caseFields,
  "ventilatorySupport",
  "regions",
  "findings",
];
const heartCaseFields = [
  ...caseFields,
  "patientAge",
  "patientGender",
  "patientBmi",
  "operatorName",
  "ventilatorySupport",
  "cardiovascularSupport",
  "heartRate",
  "bloodPressure",
  "centralVenousPressure",
  "views",
  "findings",
];
const versionSevenHeartCaseFields = [
  ...caseFields,
  "ventilatorySupport",
  "cardiovascularSupport",
  "heartRate",
  "bloodPressure",
  "centralVenousPressure",
  "views",
  "findings",
];
const abdomenCaseFields = [
  ...caseFields, "patientAge", "patientGender", "patientBmi", "examinationPoints", "rightUpperQuadrant", "leftUpperQuadrant",
  "rightKidney", "rightHydronephrosis", "leftKidney", "leftHydronephrosis",
  "bladderSize", "bladderDescription", "freeFluid", "otherComments",
];
const versionNineAbdomenCaseFields = [
  ...caseFields, "examinationPoints", "rightUpperQuadrant", "leftUpperQuadrant",
  "rightKidney", "rightHydronephrosis", "leftKidney", "leftHydronephrosis",
  "bladderSize", "bladderDescription", "freeFluid", "otherComments",
];
const abdomenPoints = ["RUQ (diaphragm and liver)", "LUQ (diaphragm and spleen)", "Right kidney", "Left kidney", "Pelvis (bladder)", "RIF and LIF (ascites)"];
const dvtCaseFields = [
  ...caseFields,
  "findings",
  "otherComments",
];
const hdCaseFields = [...caseFields, "questionFindings", "questionNotes", "measurements", "otherComments"];
const vascularCaseFields = [...caseFields, "procedureCategory", "procedure", "insertionSite", "lineType", "piccMidlineSubstitution", "assessments", "otherComments"];
const vascularProcedures: VascularProcedure[] = VASCULAR_PROCEDURES.map(([key]) => key);
const vascularAssessments: VascularAssessment[] = VASCULAR_ASSESSMENTS.map(([key]) => key);
const versionOneLungCaseFields = [
  ...legacyCaseFields,
  "ventilatorySupport",
  "regions",
  "findings",
];
const versionOneHeartCaseFields = [
  ...legacyCaseFields,
  "ventilatorySupport",
  "cardiovascularSupport",
  "heartRate",
  "bloodPressure",
  "centralVenousPressure",
  "views",
  "findings",
];
const versionTwoLungCaseFields = [
  ...versionTwoCaseFields,
  "ventilatorySupport",
  "regions",
  "findings",
];
const versionTwoHeartCaseFields = [
  ...versionTwoCaseFields,
  "ventilatorySupport",
  "cardiovascularSupport",
  "heartRate",
  "bloodPressure",
  "centralVenousPressure",
  "views",
  "findings",
];

const assessments: Assessment[] = ["not_assessed", "yes", "no", "unable"];
const caseTypes: CaseType[] = ["clinical", "healthy_volunteer"];
const impressionCategories: ImpressionCategory[] = [
  "not_recorded",
  "normal",
  "abnormal",
  "indeterminate",
];
const managementImpacts: ManagementImpact[] = [
  "not_recorded",
  "changed",
  "unchanged",
];
const imageQualities: ImageQuality[] = [
  "not_recorded",
  "good",
  "acceptable",
  "poor",
];
const lungRegions: LungRegion[] = [...LUNG_REGIONS];
const lungFindings: LungFinding[] = LUNG_FINDINGS.map(([key]) => key);
const heartFindings: HeartFinding[] = HEART_FINDINGS.map(([key]) => key);
const heartViews: HeartView[] = [...HEART_VIEWS];
const dvtSites: DvtSite[] = [...DVT_SITES];
const dvtSiteFindings: DvtSiteFinding[] = DVT_SITE_FINDINGS.map(([key]) => key);
const hdQuestions: HdQuestion[] = HD_QUESTIONS.map(([key]) => key);
const hdMeasurements: HdMeasurement[] = HD_MEASUREMENTS.map(([key]) => key);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return (
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}

function isString(value: unknown, maximumLength = 2000): value is string {
  return typeof value === "string" && value.length <= maximumLength;
}

function isEnum<T extends string>(
  value: unknown,
  choices: readonly T[],
): value is T {
  return typeof value === "string" && choices.includes(value as T);
}

function isUniqueEnumArray<T extends string>(
  value: unknown,
  choices: readonly T[],
): value is T[] {
  return (
    Array.isArray(value) &&
    value.every((entry) => isEnum(entry, choices)) &&
    new Set(value).size === value.length
  );
}

function isDateOnly(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().startsWith(value);
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

function isAssessment(value: unknown): value is Assessment {
  return isEnum(value, assessments);
}

function isLungFindingRecord(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasExactKeys(value, lungFindings) &&
    lungFindings.every((key) => isAssessment(value[key]))
  );
}

function isLungFindings(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasExactKeys(value, lungRegions) &&
    lungRegions.every((region) => isLungFindingRecord(value[region]))
  );
}

function isHeartFindings(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasExactKeys(value, heartFindings) &&
    heartFindings.every((key) => isAssessment(value[key]))
  );
}

function isDvtFindings(value: unknown): boolean {
  if (!isRecord(value) || !hasExactKeys(value, dvtSites)) return false;
  return dvtSites.every((site) => {
    const siteFindings = value[site];
    return isRecord(siteFindings) && hasExactKeys(siteFindings, dvtSiteFindings) &&
      dvtSiteFindings.every((finding) => isAssessment(siteFindings[finding]));
  });
}

function isHdQuestionRecord(value: unknown): boolean {
  return isRecord(value) && hasExactKeys(value, hdQuestions) &&
    hdQuestions.every((key) => isAssessment(value[key]));
}

function isHdStringRecord(value: unknown, keys: readonly string[]): boolean {
  return isRecord(value) && hasExactKeys(value, keys) && keys.every((key) => isString(value[key], 500));
}

function isVascularAssessmentRecord(value: unknown): boolean {
  return isRecord(value) && hasExactKeys(value, vascularAssessments) &&
    vascularAssessments.every((key) => isAssessment(value[key]));
}

function isCommonCase(
  value: Record<string, unknown>,
  schemaVersion: number,
): boolean {
  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    value.id.length <= 100 &&
    isDateOnly(value.date) &&
    isEnum(value.caseType, caseTypes) &&
    typeof value.supervised === "boolean" &&
    isString(value.supervisorName, 100) &&
    isString(value.indication, 160) &&
    isString(value.diagnosis, 160) &&
    (schemaVersion === VERSION_ONE_BACKUP ||
      (isEnum(value.impressionCategory, impressionCategories) &&
        isEnum(value.managementImpact, managementImpacts))) &&
    (schemaVersion !== VERSION_TWO_BACKUP ||
      typeof value.curriculumPlus === "boolean") &&
    isEnum(value.imageQuality, imageQualities) &&
    isString(value.summary) &&
    isString(value.reflection) &&
    isIsoTimestamp(value.createdAt) &&
    isIsoTimestamp(value.updatedAt)
  );
}

function isLogbookCase(
  value: unknown,
  schemaVersion: number,
): value is LogbookCase | VersionOneLogbookCase | VersionTwoLogbookCase {
  if (!isRecord(value) || !isCommonCase(value, schemaVersion)) return false;

  if (value.pathway === "lung") {
    return (
      hasExactKeys(
        value,
        schemaVersion === VERSION_ONE_BACKUP
          ? versionOneLungCaseFields
          : schemaVersion === VERSION_TWO_BACKUP
            ? versionTwoLungCaseFields
            : schemaVersion >= VERSION_NINE_BACKUP
              ? lungCaseFields
              : versionEightLungCaseFields,
      ) &&
      (schemaVersion < VERSION_NINE_BACKUP ||
        (isString(value.patientAge, 20) && isString(value.patientGender, 40) && isString(value.patientBmi, 20))) &&
      isUniqueEnumArray(value.regions, lungRegions) &&
      isString(value.ventilatorySupport, 120) &&
      isLungFindings(value.findings)
    );
  }

  if (value.pathway === "heart") {
    return (
      hasExactKeys(
        value,
        schemaVersion === VERSION_ONE_BACKUP
          ? versionOneHeartCaseFields
          : schemaVersion === VERSION_TWO_BACKUP
            ? versionTwoHeartCaseFields
            : schemaVersion >= VERSION_EIGHT_BACKUP
              ? heartCaseFields
              : versionSevenHeartCaseFields,
      ) &&
      (schemaVersion < VERSION_EIGHT_BACKUP ||
        (isString(value.patientAge, 20) && isString(value.patientGender, 40) &&
          isString(value.patientBmi, 20) && isString(value.operatorName, 100))) &&
      isString(value.cardiovascularSupport, 120) &&
      isString(value.heartRate, 40) &&
      isString(value.bloodPressure, 40) &&
      isString(value.centralVenousPressure, 40) &&
      isString(value.ventilatorySupport, 120) &&
      isUniqueEnumArray(value.views, heartViews) &&
      isHeartFindings(value.findings)
    );
  }

  if (value.pathway === "abdomen" && schemaVersion >= VERSION_FOUR_BACKUP && schemaVersion <= BACKUP_SCHEMA_VERSION) {
    return hasExactKeys(value, schemaVersion === BACKUP_SCHEMA_VERSION ? abdomenCaseFields : versionNineAbdomenCaseFields) &&
      (schemaVersion !== BACKUP_SCHEMA_VERSION ||
        (isString(value.patientAge, 20) && isString(value.patientGender, 40) && isString(value.patientBmi, 20))) &&
      isUniqueEnumArray(value.examinationPoints, abdomenPoints) &&
      ["rightUpperQuadrant", "leftUpperQuadrant", "rightKidney", "leftKidney", "bladderDescription", "freeFluid", "otherComments"].every((key) => isString(value[key])) &&
      ["not_assessed", "none", "mild", "moderate", "severe"].includes(String(value.rightHydronephrosis)) &&
      ["not_assessed", "none", "mild", "moderate", "severe"].includes(String(value.leftHydronephrosis)) &&
      ["not_assessed", "not_seen", "small", "normal", "large"].includes(String(value.bladderSize));
  }

  if (value.pathway === "dvt" && schemaVersion >= VERSION_FIVE_BACKUP && schemaVersion <= BACKUP_SCHEMA_VERSION) {
    return hasExactKeys(value, dvtCaseFields) && isDvtFindings(value.findings) && isString(value.otherComments);
  }
  if (value.pathway === "hd" && schemaVersion >= VERSION_SIX_BACKUP && schemaVersion <= BACKUP_SCHEMA_VERSION) {
    return hasExactKeys(value, hdCaseFields) && isHdQuestionRecord(value.questionFindings) &&
      isHdStringRecord(value.questionNotes, hdQuestions) && isHdStringRecord(value.measurements, hdMeasurements) &&
      isString(value.otherComments);
  }
  if (value.pathway === "vascular" && schemaVersion >= VERSION_SEVEN_BACKUP && schemaVersion <= BACKUP_SCHEMA_VERSION) {
    return hasExactKeys(value, vascularCaseFields) && isEnum(value.procedureCategory, vascularProcedures) &&
      isString(value.procedure, 500) && isString(value.insertionSite, 160) && isString(value.lineType, 160) && typeof value.piccMidlineSubstitution === "boolean" &&
      isVascularAssessmentRecord(value.assessments) && isString(value.otherComments, 2000);
  }
  return false;
}

function normalizeLegacyDemographics(entries: unknown[]): LogbookCase[] {
  return entries.map((item) => {
    const entry = item as LogbookCase & Partial<Pick<LungCaseFields, "patientAge" | "patientGender" | "patientBmi">> & {
      operatorName?: string;
    };
    if (entry.pathway === "lung") {
      return { ...entry, patientAge: entry.patientAge ?? "", patientGender: entry.patientGender ?? "", patientBmi: entry.patientBmi ?? "" };
    }
    if (entry.pathway === "heart") {
      return { ...entry, patientAge: entry.patientAge ?? "", patientGender: entry.patientGender ?? "", patientBmi: entry.patientBmi ?? "", operatorName: entry.operatorName ?? "" };
    }
    if (entry.pathway === "abdomen") {
      return { ...entry, patientAge: entry.patientAge ?? "", patientGender: entry.patientGender ?? "", patientBmi: entry.patientBmi ?? "" };
    }
    return entry;
  });
}

function isBackupEnvelope(value: unknown): value is BackupEnvelope {
  return (
    isRecord(value) &&
    hasExactKeys(value, [
      "app",
      "schemaVersion",
      "exportedAt",
      "cases",
      "pathwayModes",
    ]) &&
    value.app === BACKUP_APP_ID &&
    typeof value.schemaVersion === "number" &&
    isIsoTimestamp(value.exportedAt) &&
    Array.isArray(value.cases) &&
    isRecord(value.pathwayModes) &&
    hasExactKeys(value.pathwayModes,
      value.schemaVersion >= VERSION_SEVEN_BACKUP ? ["lung", "heart", "abdomen", "dvt", "hd", "vascular"] :
        value.schemaVersion === VERSION_SIX_BACKUP ? ["lung", "heart", "abdomen", "dvt", "hd"] :
        value.schemaVersion === VERSION_FIVE_BACKUP ? ["lung", "heart", "abdomen", "dvt"] :
        value.schemaVersion === VERSION_FOUR_BACKUP ? ["lung", "heart", "abdomen"] : ["lung", "heart"],
    ) &&
    typeof value.pathwayModes.lung === "boolean" &&
    typeof value.pathwayModes.heart === "boolean" &&
    (value.schemaVersion < VERSION_FOUR_BACKUP || typeof value.pathwayModes.abdomen === "boolean") &&
    (value.schemaVersion < VERSION_FIVE_BACKUP || typeof value.pathwayModes.dvt === "boolean") &&
    (value.schemaVersion < VERSION_SIX_BACKUP || typeof value.pathwayModes.hd === "boolean") &&
    (value.schemaVersion < VERSION_SEVEN_BACKUP || typeof value.pathwayModes.vascular === "boolean")
  );
}

export function createBackup(
  cases: LogbookCase[],
  pathwayModes: Record<Pathway, boolean>,
  exportedAt = new Date().toISOString(),
): LogbookBackup {
  return {
    app: BACKUP_APP_ID,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt,
    cases,
    pathwayModes,
  };
}

export function parseBackup(serialized: string): LogbookBackup {
  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch {
    throw new Error("This file is not valid JSON.");
  }

  if (
    !isBackupEnvelope(value) ||
    ![
      VERSION_ONE_BACKUP,
      VERSION_TWO_BACKUP,
      VERSION_THREE_BACKUP,
      VERSION_FOUR_BACKUP,
      VERSION_FIVE_BACKUP,
      VERSION_SIX_BACKUP,
      VERSION_SEVEN_BACKUP,
      VERSION_EIGHT_BACKUP,
      VERSION_NINE_BACKUP,
      BACKUP_SCHEMA_VERSION,
    ].includes(value.schemaVersion) ||
    !value.cases.every((entry) =>
      isLogbookCase(entry, value.schemaVersion as number),
    )
  ) {
    throw new Error(
      `This file is not a valid CritSono: POCUS Logbook backup (supported formats: versions 1–${BACKUP_SCHEMA_VERSION}).`,
    );
  }

  const ids = value.cases.map((entry) => entry.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("This backup contains duplicate case IDs.");
  }

  if (value.schemaVersion === VERSION_ONE_BACKUP) {
    return {
      app: BACKUP_APP_ID,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: value.exportedAt,
      cases: normalizeLegacyDemographics(value.cases.map(
        (entry): LogbookCase => ({
          ...entry,
          impressionCategory: "not_recorded",
          managementImpact: "not_recorded",
        }),
      )),
      pathwayModes: { ...value.pathwayModes, abdomen: true, dvt: true, hd: true, vascular: true } as Record<Pathway, boolean>,
    };
  }

  if (value.schemaVersion === VERSION_TWO_BACKUP) {
    return {
      app: BACKUP_APP_ID,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: value.exportedAt,
      cases: normalizeLegacyDemographics(value.cases.map((entry): LogbookCase => {
        const {
          curriculumPlus: _curriculumPlus,
          ...currentEntry
        } = entry as VersionTwoLogbookCase;
        return currentEntry;
      })),
      pathwayModes: { ...value.pathwayModes, abdomen: true, dvt: true, hd: true, vascular: true } as Record<Pathway, boolean>,
    };
  }

  if (value.schemaVersion === VERSION_THREE_BACKUP) {
    return {
      app: BACKUP_APP_ID,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: value.exportedAt,
      cases: normalizeLegacyDemographics(value.cases),
      pathwayModes: { ...value.pathwayModes, abdomen: true, dvt: true, hd: true, vascular: true } as Record<Pathway, boolean>,
    };
  }

  if (value.schemaVersion === VERSION_FOUR_BACKUP) {
    return {
      app: BACKUP_APP_ID,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: value.exportedAt,
      cases: normalizeLegacyDemographics(value.cases),
      pathwayModes: { ...value.pathwayModes, dvt: true, hd: true, vascular: true } as Record<Pathway, boolean>,
    };
  }

  if (value.schemaVersion === VERSION_FIVE_BACKUP) {
    return {
      app: BACKUP_APP_ID,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: value.exportedAt,
      cases: normalizeLegacyDemographics(value.cases),
      pathwayModes: { ...value.pathwayModes, hd: true, vascular: true } as Record<Pathway, boolean>,
    };
  }

  if (value.schemaVersion === VERSION_SIX_BACKUP) {
    return {
      app: BACKUP_APP_ID,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: value.exportedAt,
      cases: normalizeLegacyDemographics(value.cases),
      pathwayModes: { ...value.pathwayModes, vascular: true } as Record<Pathway, boolean>,
    };
  }

  if (value.schemaVersion === VERSION_SEVEN_BACKUP) {
    return {
      app: BACKUP_APP_ID,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: value.exportedAt,
      cases: normalizeLegacyDemographics(value.cases),
      pathwayModes: value.pathwayModes as Record<Pathway, boolean>,
    };
  }

  if (value.schemaVersion === VERSION_EIGHT_BACKUP) {
    return {
      app: BACKUP_APP_ID,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: value.exportedAt,
      cases: normalizeLegacyDemographics(value.cases),
      pathwayModes: value.pathwayModes as Record<Pathway, boolean>,
    };
  }

  if (value.schemaVersion === VERSION_NINE_BACKUP) {
    return {
      app: BACKUP_APP_ID,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: value.exportedAt,
      cases: normalizeLegacyDemographics(value.cases),
      pathwayModes: value.pathwayModes as Record<Pathway, boolean>,
    };
  }

  return value as LogbookBackup;
}
