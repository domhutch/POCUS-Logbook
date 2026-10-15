import "fake-indexeddb/auto";
import { openDB, type DBSchema } from "idb";
import { expect, it } from "vitest";
import { addTimestamps, createDraft, type Pathway } from "../domain/logbook";

interface LegacyLogbookDatabase extends DBSchema {
  cases: {
    key: string;
    value: Record<string, unknown>;
  };
  settings: {
    key: Pathway;
    value: { pathway: Pathway; trainingMode: boolean };
  };
}

const legacyCase: Record<string, unknown> = {
  ...addTimestamps(createDraft("lung")),
  impressionCategory: "abnormal",
  managementImpact: "changed",
  curriculumPlus: true,
};
const versionTwoDatabase = await openDB<LegacyLogbookDatabase>(
  "pocus-logbook",
  2,
  {
    upgrade(db) {
      db.createObjectStore("cases", { keyPath: "id" });
      db.createObjectStore("settings", { keyPath: "pathway" });
    },
  },
);
await versionTwoDatabase.put("cases", legacyCase);
await versionTwoDatabase.put("settings", {
  pathway: "lung",
  trainingMode: false,
});
versionTwoDatabase.close();

const { getCases, getPathwayModes } = await import("./logbook-store");

it("removes the obsolete marker from existing cases without losing other data", async () => {
  const [cases, modes] = await Promise.all([getCases(), getPathwayModes()]);

  expect(cases).toHaveLength(1);
  expect(cases[0]).toMatchObject({
    id: legacyCase.id,
    diagnosis: legacyCase.diagnosis,
    impressionCategory: "abnormal",
    managementImpact: "changed",
  });
  expect(cases[0]).not.toHaveProperty("curriculumPlus");
  expect(modes).toEqual({ lung: false });
});
