import { expect, it } from "vitest";
import { PATHWAY_REQUIREMENTS } from "./pathway-requirements";

it("records a sourced, bounded logbook route for each pathway", () => {
  expect(Object.keys(PATHWAY_REQUIREMENTS)).toHaveLength(7);

  for (const requirement of Object.values(PATHWAY_REQUIREMENTS)) {
    expect(requirement.source.url).toMatch(/^https:\/\//);
    expect(requirement.source.version).not.toBe("");
    expect(requirement.collectionWindowMonths).toBe(12);
    expect(requirement.directlySupervisedScans).toBeLessThanOrEqual(
      requirement.totalScans,
    );
  }
});

it("keeps vascular scan-type minima and supervision quotas distinct", () => {
  expect(PATHWAY_REQUIREMENTS.vascular.scanTypeQuotas).toEqual([
    expect.objectContaining({
      minimumScans: 5,
      minimumDirectlySupervised: 3,
    }),
    expect.objectContaining({
      minimumScans: 3,
      minimumDirectlySupervised: 1,
    }),
    expect.objectContaining({
      minimumScans: 2,
      minimumDirectlySupervised: 1,
    }),
  ]);
});

it("preserves the separate fTOE alternate route and HD effective date", () => {
  expect(PATHWAY_REQUIREMENTS.focusedToe.alternateLogbookRoute).toMatchObject({
    totalScans: 30,
    directlySupervisedScans: 20,
  });
  expect(PATHWAY_REQUIREMENTS.hd.effectiveDatedChanges?.[0]).toMatchObject({
    effectiveFrom: "2026-02-01",
  });
});
