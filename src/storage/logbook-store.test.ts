import "fake-indexeddb/auto";
import { describe, expect, it, vi } from "vitest";
import { createBackup, parseBackup } from "../domain/backup";
import { createSampleCases } from "../domain/metrics";
import {
  addTimestamps,
  createDraft,
  type LogbookCase,
  type Pathway,
} from "../domain/logbook";
import {
  getCases,
  getPathwayModes,
  addSampleCases,
  deleteSampleCases,
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
    const modes: Record<Pathway, boolean> = { lung: false, heart: false, abdomen: true, dvt: true, hd: true, vascular: true };
    const backup = parseBackup(
      JSON.stringify(createBackup([conflictingCase, importedCase], modes)),
    );

    await expect(restoreBackup(backup)).resolves.toEqual({
      addedCases: 1,
      skippedCases: 1,
      importedPathwayModes: 5,
    });

    const restoredCases = await getCases();
    expect(restoredCases).toHaveLength(2);
    expect(
      restoredCases.find((entry) => entry.id === localCase.id)?.diagnosis,
    ).toBe(localCase.diagnosis);
    expect(
      restoredCases.find((entry) => entry.id === importedCase.id)?.pathway,
    ).toBe("heart");
    expect(await getPathwayModes()).toEqual({ lung: true, heart: false, abdomen: true, dvt: true, hd: true, vascular: true });

    await expect(restoreBackup(backup)).resolves.toEqual({
      addedCases: 0,
      skippedCases: 2,
      importedPathwayModes: 0,
    });
    expect(await getCases()).toHaveLength(2);
    expect(await getPathwayModes()).toEqual({ lung: true, heart: false, abdomen: true, dvt: true, hd: true, vascular: true });
  });
});

describe("pathway training modes", () => {
  it("stores each pathway mode separately without changing cases", async () => {
    const casesBefore = await getCases();
    await savePathwayMode("heart", false);
    await savePathwayMode("lung", true);

    expect(await getPathwayModes()).toEqual({ heart: false, lung: true, abdomen: true, dvt: true, hd: true, vascular: true });
    expect(await getCases()).toEqual(casesBefore);
  });
});

describe("case persistence failures", () => {
  it("rejects a failed write and leaves the case unsaved", async () => {
    const draft = createDraft("heart");
    draft.id = "case-write-failure";
    const put = vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(() => {
      throw new DOMException("Storage is full", "QuotaExceededError");
    });

    try {
      await expect(saveCase(draft)).rejects.toMatchObject({
        name: "QuotaExceededError",
        message: "Storage is full",
      });
    } finally {
      put.mockRestore();
    }

    expect(await getCases()).not.toContainEqual(
      expect.objectContaining({ id: draft.id }),
    );
  });
});

describe("sample cases", () => {
  it("adds samples idempotently and removes only marked sample records", async () => {
    const casesBefore = await getCases();
    const samples = createSampleCases("heart", new Date(2026, 9, 15));

    await expect(addSampleCases(samples)).resolves.toBe(samples.length);
    await expect(addSampleCases(samples)).resolves.toBe(0);
    expect(await getCases()).toHaveLength(casesBefore.length + samples.length);

    await expect(deleteSampleCases()).resolves.toBe(samples.length);
    expect(await getCases()).toEqual(casesBefore);
  });
});
