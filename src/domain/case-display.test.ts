import { describe, expect, it } from "vitest";
import { addTimestamps, createDraft } from "./logbook";
import { getCaseSequenceNumbers } from "./case-display";

function makeCase(
  id: string,
  pathway: "heart" | "lung",
  date: string,
  createdAt: string,
) {
  const draft = createDraft(pathway);
  draft.id = id;
  draft.date = date;
  return { ...addTimestamps(draft), createdAt };
}

describe("case sequence numbers", () => {
  it("numbers each pathway by scan date and keeps same-day order stable", () => {
    const cases = [
      makeCase("heart-later", "heart", "2026-10-16", "2026-10-16T12:02:00.000Z"),
      makeCase("lung-first", "lung", "2026-10-15", "2026-10-15T12:00:00.000Z"),
      makeCase("heart-first", "heart", "2026-10-16", "2026-10-16T12:01:00.000Z"),
      makeCase("heart-oldest", "heart", "2026-10-14", "2026-10-14T12:00:00.000Z"),
    ];
    const numbers = getCaseSequenceNumbers(cases);

    expect(numbers.get("heart-oldest")).toBe(1);
    expect(numbers.get("heart-first")).toBe(2);
    expect(numbers.get("heart-later")).toBe(3);
    expect(numbers.get("lung-first")).toBe(1);
  });

  it("closes gaps after deletion and shifts numbers when an earlier case is merged", () => {
    const firstHeart = makeCase("heart-1", "heart", "2026-10-15", "2026-10-15T12:00:00.000Z");
    const secondHeart = makeCase("heart-2", "heart", "2026-10-16", "2026-10-16T12:00:00.000Z");
    const thirdHeart = makeCase("heart-3", "heart", "2026-10-17", "2026-10-17T12:00:00.000Z");
    const firstLung = makeCase("lung-1", "lung", "2026-10-16", "2026-10-16T12:00:00.000Z");

    const afterDelete = getCaseSequenceNumbers([firstHeart, thirdHeart, firstLung]);
    expect(afterDelete.get("heart-1")).toBe(1);
    expect(afterDelete.get("heart-3")).toBe(2);

    const importedEarlier = makeCase("heart-import", "heart", "2026-10-14", "2026-10-14T12:00:00.000Z");
    const afterMerge = getCaseSequenceNumbers([
      firstHeart,
      secondHeart,
      thirdHeart,
      firstLung,
      importedEarlier,
    ]);
    expect(afterMerge.get("heart-import")).toBe(1);
    expect(afterMerge.get("heart-1")).toBe(2);
    expect(afterMerge.get("heart-2")).toBe(3);
    expect(afterMerge.get("heart-3")).toBe(4);
    expect(afterMerge.get("lung-1")).toBe(1);
  });
});
