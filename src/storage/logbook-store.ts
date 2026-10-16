import { openDB, type DBSchema } from "idb";
import type { LogbookBackup } from "../domain/backup";
import {
  addTimestamps,
  type CaseDraft,
  type LogbookCase,
  type Pathway,
} from "../domain/logbook";

interface PathwayMode {
  pathway: Pathway;
  trainingMode: boolean;
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

const database = openDB<LogbookDatabase>("pocus-logbook", 3, {
  blocked() {
    window.dispatchEvent(new Event("pocus-logbook-upgrade-blocked"));
  },
  upgrade(db, oldVersion, _newVersion, transaction) {
    if (oldVersion < 1) {
      db.createObjectStore("cases", { keyPath: "id" });
      db.createObjectStore("settings", { keyPath: "pathway" });
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
  return (await database).getAll("cases");
}

export async function saveCase(draft: CaseDraft): Promise<void> {
  const db = await database;
  const existing = await db.get("cases", draft.id);
  await db.put("cases", addTimestamps(draft, existing));
}

export async function deleteCase(id: string): Promise<void> {
  await (await database).delete("cases", id);
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

  for (const pathway of ["lung", "heart"] as const) {
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
