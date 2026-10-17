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
  dvt: true,
  hd: true,
  vascular: true,
};

function makeBackup(cases: LogbookCase[] = []) {
  return JSON.stringify(createBackup(cases, pathwayModes, exportedAt));
}

function makeLegacyBackup(cases: LogbookCase[], schemaVersion: 1 | 2 | 3 | 4) {
  const backup = JSON.parse(makeBackup(cases));
  backup.schemaVersion = schemaVersion;
  delete backup.pathwayModes.abdomen;
  delete backup.pathwayModes.dvt;
  delete backup.pathwayModes.hd;
  delete backup.pathwayModes.vascular;
  for (const entry of backup.cases) {
    if (entry.pathway === "lung" || entry.pathway === "heart") {
      delete entry.patientAge;
      delete entry.patientGender;
      delete entry.patientBmi;
    }
    if (entry.pathway === "heart") delete entry.operatorName;
    if (entry.pathway === "abdomen") {
      delete entry.patientAge;
      delete entry.patientGender;
      delete entry.patientBmi;
    }
  }
  return backup;
}

describe("POCUS Logbook backups", () => {
  it("round-trips all pathway cases with pathway preferences", () => {
    const cases = [
      addTimestamps(createDraft("lung")),
      addTimestamps(createDraft("heart")),
      addTimestamps(createDraft("abdomen")),
      addTimestamps(createDraft("dvt")),
      addTimestamps(createDraft("hd")),
      addTimestamps(createDraft("vascular")),
    ];

    expect(parseBackup(makeBackup(cases))).toEqual({
      app: "pocus-logbook",
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt,
      cases,
      pathwayModes,
    });
  });

  it("upgrades version 4 backups by enabling the DVT pathway", () => {
    const backup = makeLegacyBackup([addTimestamps(createDraft("abdomen"))], 4);
    backup.pathwayModes = { lung: false, heart: true, abdomen: true };
    expect(parseBackup(JSON.stringify(backup)).pathwayModes).toEqual(pathwayModes);
  });

  it("upgrades version 5 backups by enabling the HD pathway", () => {
    const current = JSON.parse(makeBackup([addTimestamps(createDraft("dvt"))]));
    current.schemaVersion = 5;
    delete current.pathwayModes.hd;
    delete current.pathwayModes.vascular;
    expect(parseBackup(JSON.stringify(current)).pathwayModes).toEqual(pathwayModes);
  });

  it("adds blank Abdomen demographics when restoring version 9 backups", () => {
    const current = JSON.parse(makeBackup([addTimestamps(createDraft("abdomen"))]));
    current.schemaVersion = 9;
    delete current.cases[0].patientAge;
    delete current.cases[0].patientGender;
    delete current.cases[0].patientBmi;

    const restored = parseBackup(JSON.stringify(current));

    expect(restored.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(restored.cases[0]).toMatchObject({
      pathway: "abdomen",
      patientAge: "",
      patientGender: "",
      patientBmi: "",
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
    expect(restored.pathwayModes).toEqual({ lung: false, heart: true, abdomen: true, dvt: true, hd: true, vascular: true });
    expect(restored.cases).toEqual([{
      ...backup.cases[0],
      patientAge: "",
      patientGender: "",
      patientBmi: "",
      operatorName: "",
    }]);
  });
});
