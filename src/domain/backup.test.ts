import { describe, expect, it } from "vitest";
import {
  BACKUP_SCHEMA_VERSION,
  createBackup,
  parseBackup,
} from "./backup";
import {
  addTimestamps,
  createDraft,
  type LogbookCase,
  type Pathway,
} from "./logbook";

const exportedAt = "2026-10-15T12:00:00.000Z";
const pathwayModes: Record<Pathway, boolean> = {
  lung: false,
  heart: true,
  abdomen: true,
};

function makeBackup(cases: LogbookCase[] = []) {
  return JSON.stringify(createBackup(cases, pathwayModes, exportedAt));
}

function makeLegacyBackup(cases: LogbookCase[], schemaVersion: 1 | 2 | 3) {
  const backup = JSON.parse(makeBackup(cases));
  backup.schemaVersion = schemaVersion;
  delete backup.pathwayModes.abdomen;
  return backup;
}

describe("POCUS Logbook backups", () => {
  it("round-trips Lung, Heart, and Abdomen cases with pathway preferences", () => {
    const cases = [
      addTimestamps(createDraft("lung")),
      addTimestamps(createDraft("heart")),
      addTimestamps(createDraft("abdomen")),
    ];

    expect(parseBackup(makeBackup(cases))).toEqual({
      app: "pocus-logbook",
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt,
      cases,
      pathwayModes,
    });
  });

  it("rejects malformed JSON", () => {
    expect(() => parseBackup("{")).toThrow("not valid JSON");
  });

  it("rejects unsupported backup versions before restore", () => {
    const backup = JSON.parse(makeBackup());
    backup.schemaVersion = BACKUP_SCHEMA_VERSION + 1;

    expect(() => parseBackup(JSON.stringify(backup))).toThrow(
      `supported formats: versions 1–${BACKUP_SCHEMA_VERSION}`,
    );
  });

  it("rejects extra fields instead of importing hidden data", () => {
    const backup = JSON.parse(
      makeBackup([addTimestamps(createDraft("lung"))]),
    );
    backup.cases[0].patientName = "Unexpected field";

    expect(() => parseBackup(JSON.stringify(backup))).toThrow(
      `supported formats: versions 1–${BACKUP_SCHEMA_VERSION}`,
    );
  });

  it("rejects malformed pathway findings", () => {
    const backup = JSON.parse(
      makeBackup([addTimestamps(createDraft("heart"))]),
    );
    backup.cases[0].findings.lvDilated = "maybe";

    expect(() => parseBackup(JSON.stringify(backup))).toThrow(
      `supported formats: versions 1–${BACKUP_SCHEMA_VERSION}`,
    );
  });

  it("rejects duplicate case IDs", () => {
    const entry = addTimestamps(createDraft("lung"));

    expect(() => parseBackup(makeBackup([entry, entry]))).toThrow(
      "duplicate case IDs",
    );
  });

  it("upgrades version 1 backups with default review markers", () => {
    const backup = makeLegacyBackup([
        addTimestamps(createDraft("lung")),
        addTimestamps(createDraft("heart")),
      ], 1);
    for (const entry of backup.cases) {
      delete entry.impressionCategory;
      delete entry.managementImpact;
      delete entry.curriculumPlus;
    }

    const restored = parseBackup(JSON.stringify(backup));
    expect(restored.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(
      restored.cases.map(
        ({ impressionCategory, managementImpact }) => ({
          impressionCategory,
          managementImpact,
        }),
      ),
    ).toEqual([
      {
        impressionCategory: "not_recorded",
        managementImpact: "not_recorded",
      },
      {
        impressionCategory: "not_recorded",
        managementImpact: "not_recorded",
      },
    ]);
  });

  it("upgrades version 2 backups and removes the obsolete marker", () => {
    const backup = makeLegacyBackup([addTimestamps(createDraft("lung"))], 2);
    backup.cases[0].curriculumPlus = true;
    backup.cases[0].impressionCategory = "abnormal";
    backup.cases[0].managementImpact = "changed";

    const restored = parseBackup(JSON.stringify(backup));
    expect(restored.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(restored.cases[0]).toMatchObject({
      impressionCategory: "abnormal",
      managementImpact: "changed",
    });
    expect(restored.cases[0]).not.toHaveProperty("curriculumPlus");
  });

  it("upgrades version 3 backups and enables the newly added pathway", () => {
    const backup = makeLegacyBackup([addTimestamps(createDraft("heart"))], 3);

    const restored = parseBackup(JSON.stringify(backup));

    expect(restored.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(restored.pathwayModes).toEqual({ lung: false, heart: true, abdomen: true });
    expect(restored.cases).toEqual(backup.cases);
  });
});
