import { openDB, type DBSchema } from "idb";
import type { LogbookBackup } from "../domain/backup";
import {
  addTimestamps,
  isSampleCase,
  type CaseDraft,
  type LogbookCase,
  type Pathway,
} from "../domain/logbook";

interface PathwayMode {
  pathway: Pathway;
  trainingMode: boolean;
}

export type TextSize = "small" | "default" | "large";
export type Curriculum = "fusic";

export const DEFAULT_ENABLED_MODULES: Record<Pathway, boolean> = {
  heart: true,
  lung: true,
  abdomen: false,
  dvt: false,
  hd: false,
  vascular: false,
};

export interface AppSettings {
  supervisors: string[];
  operatorName: string;
  textSize: TextSize;
  textScaleVersion: number;
  curriculum: Curriculum;
  enabledModules: Record<Pathway, boolean>;
  onboardingComplete: boolean;
}

const DEFAULT_APP_SETTINGS: AppSettings = {
  supervisors: [],
  operatorName: "",
  textSize: "default",
  textScaleVersion: 2,
  curriculum: "fusic",
  enabledModules: DEFAULT_ENABLED_MODULES,
  onboardingComplete: false,
};

interface StoredAppSettings extends AppSettings {
  id: "app";
}

interface LogbookDatabase extends DBSchema {
  cases: {
    key: string;
    value: LogbookCase;
  };
  settings: {
    key: Pathway;
    value: PathwayMode;
  };
  preferences: {
    key: "app";
    value: StoredAppSettings;
  };
}

function migrateCaseRecord(record: LogbookCase, oldVersion: number): LogbookCase {
  const migrated = { ...record } as LogbookCase & {
    impressionCategory?: LogbookCase["impressionCategory"];
    managementImpact?: LogbookCase["managementImpact"];
    curriculumPlus?: boolean;
  };

  if (oldVersion < 2) {
    migrated.impressionCategory ??= "not_recorded";
    migrated.managementImpact ??= "not_recorded";
  }
  delete migrated.curriculumPlus;
  return migrated;
}

const database = openDB<LogbookDatabase>("pocus-logbook", 4, {
  blocked() {
    window.dispatchEvent(new Event("pocus-logbook-upgrade-blocked"));
  },
  upgrade(db, oldVersion, _newVersion, transaction) {
    if (oldVersion < 1) {
      db.createObjectStore("cases", { keyPath: "id" });
      db.createObjectStore("settings", { keyPath: "pathway" });
    }
    if (oldVersion < 4) {
      db.createObjectStore("preferences", { keyPath: "id" });
    }
    if (oldVersion < 3) {
      const store = transaction.objectStore("cases");
      const migrateNextCase = (cursor: Awaited<ReturnType<typeof store.openCursor>>) => {
        if (!cursor) return;
        cursor.update(migrateCaseRecord(cursor.value, oldVersion));
        void cursor.continue().then(migrateNextCase);
      };
      void store.openCursor().then(migrateNextCase);
    }
  },
  blocking() {
    window.location.reload();
  },
});

export async function getCases(): Promise<LogbookCase[]> {
  const records = await (await database).getAll("cases");
  return records.map((record) => record.pathway === "heart"
    ? {
        ...record,
        patientAge: record.patientAge ?? "",
        patientGender: record.patientGender ?? "",
        patientBmi: record.patientBmi ?? "",
        operatorName: record.operatorName ?? "",
      }
    : record.pathway === "lung"
      ? { ...record, patientAge: record.patientAge ?? "", patientGender: record.patientGender ?? "", patientBmi: record.patientBmi ?? "" }
      : record.pathway === "abdomen"
        ? { ...record, patientAge: record.patientAge ?? "", patientGender: record.patientGender ?? "", patientBmi: record.patientBmi ?? "" }
        : record);
}

export async function saveCase(draft: CaseDraft): Promise<void> {
  const db = await database;
  const existing = await db.get("cases", draft.id);
  await db.put("cases", addTimestamps(draft, existing));
}

export async function deleteCase(id: string): Promise<void> {
  await (await database).delete("cases", id);
}

export async function addSampleCases(cases: LogbookCase[]): Promise<number> {
  const db = await database;
  const transaction = db.transaction("cases", "readwrite");
  const store = transaction.objectStore("cases");
  const existingIds = new Set((await store.getAll()).map((entry) => entry.id));
  const additions = cases.filter(
    (entry) => isSampleCase(entry) && !existingIds.has(entry.id),
  );
  await Promise.all(additions.map((entry) => store.add(entry)));
  await transaction.done;
  return additions.length;
}

export async function deleteSampleCases(): Promise<number> {
  const db = await database;
  const transaction = db.transaction("cases", "readwrite");
  const store = transaction.objectStore("cases");
  const sampleCases = (await store.getAll()).filter(isSampleCase);
  await Promise.all(sampleCases.map((entry) => store.delete(entry.id)));
  await transaction.done;
  return sampleCases.length;
}

export async function getPathwayModes(): Promise<
  Partial<Record<Pathway, boolean>>
> {
  const settings = await (await database).getAll("settings");
  return Object.fromEntries(
    settings.map(({ pathway, trainingMode }) => [pathway, trainingMode]),
  );
}

export async function savePathwayMode(
  pathway: Pathway,
  trainingMode: boolean,
): Promise<void> {
  await (await database).put("settings", { pathway, trainingMode });
}

export async function getAppSettings(): Promise<AppSettings> {
  const db = await database;
  const settings = await db.get("preferences", "app");
  if (!settings) return DEFAULT_APP_SETTINGS;
  if (
    settings.textScaleVersion !== 2 ||
    typeof settings.operatorName !== "string" ||
    !settings.curriculum ||
    !settings.enabledModules ||
    typeof settings.onboardingComplete !== "boolean" ||
    typeof settings.enabledModules.abdomen !== "boolean" ||
    typeof settings.enabledModules.dvt !== "boolean" ||
    typeof settings.enabledModules.hd !== "boolean"
    || typeof settings.enabledModules.vascular !== "boolean"
  ) {
    const migrated: AppSettings = {
      supervisors: settings.supervisors,
      operatorName: settings.operatorName ?? "",
      textSize:
        settings.textScaleVersion !== 2 && settings.textSize === "large"
          ? "default"
          : settings.textSize,
      textScaleVersion: 2,
      curriculum: "fusic",
      enabledModules: {
        heart: settings.enabledModules?.heart ?? true,
        lung: settings.enabledModules?.lung ?? true,
        abdomen: settings.enabledModules?.abdomen ?? true,
        dvt: settings.enabledModules?.dvt ?? true,
        hd: settings.enabledModules?.hd ?? true,
        vascular: settings.enabledModules?.vascular ?? true,
      },
      // A saved preferences record predating onboarding belongs to an existing user.
      onboardingComplete: settings.onboardingComplete ?? true,
    };
    await db.put("preferences", { id: "app", ...migrated });
    return migrated;
  }
  return {
    supervisors: settings.supervisors,
    operatorName: settings.operatorName,
    textSize: settings.textSize,
    textScaleVersion: settings.textScaleVersion,
    curriculum: settings.curriculum,
    enabledModules: settings.enabledModules,
    onboardingComplete: settings.onboardingComplete,
  };
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  await (await database).put("preferences", { id: "app", ...settings });
}

export interface RestoreResult {
  addedCases: number;
  skippedCases: number;
  importedPathwayModes: number;
}

export async function restoreBackup(
  backup: LogbookBackup,
): Promise<RestoreResult> {
  const db = await database;
  const transaction = db.transaction(["cases", "settings"], "readwrite");
  const [existingCases, existingModes] = await Promise.all([
    transaction.objectStore("cases").getAll(),
    transaction.objectStore("settings").getAll(),
  ]);
  const existingIds = new Set(existingCases.map((entry) => entry.id));
  const existingPathways = new Set(
    existingModes.map((entry) => entry.pathway),
  );
  let addedCases = 0;
  let skippedCases = 0;
  let importedPathwayModes = 0;
  const writes: Promise<unknown>[] = [];

  for (const entry of backup.cases) {
    if (existingIds.has(entry.id)) {
      skippedCases += 1;
      continue;
    }
    writes.push(transaction.objectStore("cases").add(entry));
    existingIds.add(entry.id);
    addedCases += 1;
  }

  for (const pathway of ["lung", "heart", "abdomen", "dvt", "hd", "vascular"] as const) {
    if (existingPathways.has(pathway)) continue;
    writes.push(
      transaction.objectStore("settings").add({
        pathway,
        trainingMode: backup.pathwayModes[pathway],
      }),
    );
    importedPathwayModes += 1;
  }

  await Promise.all(writes);
  await transaction.done;
  return { addedCases, skippedCases, importedPathwayModes };
}
