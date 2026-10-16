import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { createBackup, parseBackup } from "../domain/backup";
import {
  addTimestamps,
  createDraft,
  type LogbookCase,
  type Pathway,
} from "../domain/logbook";
import {
  getCases,
  getPathwayModes,
  restoreBackup,
  saveCase,
  savePathwayMode,
} from "./logbook-store";

describe("restoreBackup", () => {
  it("adds new cases, keeps local conflicts and preferences, and is repeatable", async () => {
    const localCase = addTimestamps(createDraft("lung"));
    await saveCase(localCase);
    await savePathwayMode("lung", true);

    const conflictingCase: LogbookCase = {
      ...localCase,
      diagnosis: "A conflicting backup must not replace this case",
    };
    const importedCase = addTimestamps(createDraft("heart"));
    const modes: Record<Pathway, boolean> = { lung: false, heart: false };
    const backup = parseBackup(
      JSON.stringify(createBackup([conflictingCase, importedCase], modes)),
    );

    await expect(restoreBackup(backup)).resolves.toEqual({
      addedCases: 1,
      skippedCases: 1,
      importedPathwayModes: 1,
    });

    const restoredCases = await getCases();
    expect(restoredCases).toHaveLength(2);
    expect(
      restoredCases.find((entry) => entry.id === localCase.id)?.diagnosis,
    ).toBe(localCase.diagnosis);
    expect(
      restoredCases.find((entry) => entry.id === importedCase.id)?.pathway,
    ).toBe("heart");
    expect(await getPathwayModes()).toEqual({ lung: true, heart: false });

    await expect(restoreBackup(backup)).resolves.toEqual({
      addedCases: 0,
      skippedCases: 2,
      importedPathwayModes: 0,
    });
    expect(await getCases()).toHaveLength(2);
    expect(await getPathwayModes()).toEqual({ lung: true, heart: false });
  });
});

describe("pathway training modes", () => {
  it("stores each pathway mode separately without changing cases", async () => {
    const casesBefore = await getCases();
    await savePathwayMode("heart", false);
    await savePathwayMode("lung", true);

    expect(await getPathwayModes()).toEqual({ heart: false, lung: true });
    expect(await getCases()).toEqual(casesBefore);
  });
});
