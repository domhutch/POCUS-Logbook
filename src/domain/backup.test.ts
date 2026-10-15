import { describe, expect, it } from "vitest";
import { createBackup, parseBackup } from "./backup";
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
};

function makeBackup(cases: LogbookCase[] = []) {
  return JSON.stringify(createBackup(cases, pathwayModes, exportedAt));
}

describe("POCUS Logbook backups", () => {
  it("round-trips Lung and Heart cases with pathway preferences", () => {
    const cases = [
      addTimestamps(createDraft("lung")),
      addTimestamps(createDraft("heart")),
    ];

    expect(parseBackup(makeBackup(cases))).toEqual({
      app: "pocus-logbook",
      schemaVersion: 1,
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
    backup.schemaVersion = 2;

    expect(() => parseBackup(JSON.stringify(backup))).toThrow(
      "supported format: version 1",
    );
  });

  it("rejects extra fields instead of importing hidden data", () => {
    const backup = JSON.parse(
      makeBackup([addTimestamps(createDraft("lung"))]),
    );
    backup.cases[0].patientName = "Unexpected field";

    expect(() => parseBackup(JSON.stringify(backup))).toThrow(
      "supported format: version 1",
    );
  });

  it("rejects malformed pathway findings", () => {
    const backup = JSON.parse(
      makeBackup([addTimestamps(createDraft("heart"))]),
    );
    backup.cases[0].findings.lvDilated = "maybe";

    expect(() => parseBackup(JSON.stringify(backup))).toThrow(
      "supported format: version 1",
    );
  });

  it("rejects duplicate case IDs", () => {
    const entry = addTimestamps(createDraft("lung"));

    expect(() => parseBackup(makeBackup([entry, entry]))).toThrow(
      "duplicate case IDs",
    );
  });
});
