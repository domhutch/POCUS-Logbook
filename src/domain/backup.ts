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
} from "./logbook";

export const BACKUP_SCHEMA_VERSION = 3;
export const BACKUP_APP_ID = "pocus-logbook";
const VERSION_ONE_BACKUP = 1;
const VERSION_TWO_BACKUP = 2;

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
  pathwayModes: Record<Pathway, boolean>;
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
  "ventilatorySupport",
  "regions",
  "findings",
];
const heartCaseFields = [
  ...caseFields,
  "ventilatorySupport",
  "cardiovascularSupport",
  "heartRate",
  "bloodPressure",
  "centralVenousPressure",
  "views",
  "findings",
];
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
    isIsoTimestamp(value.updatedAt) &&
    isString(value.ventilatorySupport, 120)
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
            : lungCaseFields,
      ) &&
      isUniqueEnumArray(value.regions, lungRegions) &&
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
            : heartCaseFields,
      ) &&
      isString(value.cardiovascularSupport, 120) &&
      isString(value.heartRate, 40) &&
      isString(value.bloodPressure, 40) &&
      isString(value.centralVenousPressure, 40) &&
      isUniqueEnumArray(value.views, heartViews) &&
      isHeartFindings(value.findings)
    );
  }

  return false;
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
    hasExactKeys(value.pathwayModes, ["lung", "heart"]) &&
    typeof value.pathwayModes.lung === "boolean" &&
    typeof value.pathwayModes.heart === "boolean"
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
      BACKUP_SCHEMA_VERSION,
    ].includes(value.schemaVersion) ||
    !value.cases.every((entry) =>
      isLogbookCase(entry, value.schemaVersion as number),
    )
  ) {
    throw new Error(
      `This file is not a valid POCUS Logbook backup (supported formats: versions 1–${BACKUP_SCHEMA_VERSION}).`,
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
      cases: value.cases.map(
        (entry): LogbookCase => ({
          ...entry,
          impressionCategory: "not_recorded",
          managementImpact: "not_recorded",
        }),
      ),
      pathwayModes: value.pathwayModes,
    };
  }

  if (value.schemaVersion === VERSION_TWO_BACKUP) {
    return {
      app: BACKUP_APP_ID,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: value.exportedAt,
      cases: value.cases.map((entry): LogbookCase => {
        const {
          curriculumPlus: _curriculumPlus,
          ...currentEntry
        } = entry as VersionTwoLogbookCase;
        return currentEntry;
      }),
      pathwayModes: value.pathwayModes,
    };
  }

  return value as LogbookBackup;
}
