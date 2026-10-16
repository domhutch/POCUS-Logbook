import { describe, expect, it } from "vitest";
import { addTimestamps, createDraft } from "./logbook";
import {
  createSampleCases,
  summarizeCaseMix,
  summarizeCases,
  summarizeTrainingProgress,
} from "./metrics";

describe("case metrics", () => {
  const now = new Date(2026, 9, 15);

  it("summarizes six months of activity and pathway-specific Lung details", () => {
    const samples = createSampleCases("lung", now);
    const metrics = summarizeCases(samples, "lung", now);

    expect(metrics.totalCases).toBe(19);
    expect(metrics.monthlyActivity.map((month) => month.count)).toEqual([
      2, 3, 4, 2, 5, 3,
    ]);
    expect(metrics.scanDetails).toHaveLength(6);
    expect(metrics.scanDetails.some((detail) => detail.count > 0)).toBe(true);
    expect(metrics.findings).toHaveLength(4);
    expect(metrics.findings.some((finding) => finding.count > 0)).toBe(true);
  });

  it("summarizes pathway-specific Heart views and excludes other pathways", () => {
    const heart = createSampleCases("heart", now);
    const lungDraft = createDraft("lung");
    const metrics = summarizeCases(
      [...heart, addTimestamps(lungDraft)],
      "heart",
      now,
    );

    expect(metrics.totalCases).toBe(19);
    expect(metrics.scanDetails.map((detail) => detail.label)).toEqual([
      "PLAX",
      "PSAX",
      "Apical 4-chamber",
      "Subcostal 4-chamber",
      "IVC",
    ]);
    expect(metrics.imageQuality.reduce((total, item) => total + item.count, 0)).toBe(19);
    expect(metrics.impressions.reduce((total, item) => total + item.count, 0)).toBe(19);
    expect(metrics.findings).toHaveLength(7);
  });

  it("returns zero-filled buckets for an empty pathway", () => {
    const metrics = summarizeCases([], "lung", now);

    expect(metrics.totalCases).toBe(0);
    expect(metrics.monthlyActivity).toHaveLength(6);
    expect(metrics.monthlyActivity.every((month) => month.count === 0)).toBe(true);
    expect(metrics.scanDetails.every((detail) => detail.count === 0)).toBe(true);
    expect(metrics.findings.every((finding) => finding.count === 0)).toBe(true);
  });

  it("handles empty, exactly-at-target, and over-target training progress", () => {
    const empty = summarizeTrainingProgress([], "heart");
    expect(empty).toMatchObject({
      totalCases: 0,
      supervisedCases: 0,
      totalTarget: 50,
      supervisedTarget: 10,
      totalTargetMet: false,
      supervisedTargetMet: false,
    });

    const atTarget = Array.from({ length: 50 }, (_, index) => {
      const draft = createDraft("heart");
      draft.supervised = index < 10;
      return addTimestamps(draft);
    });
    expect(summarizeTrainingProgress(atTarget, "heart")).toMatchObject({
      totalCases: 50,
      supervisedCases: 10,
      totalTargetMet: true,
      supervisedTargetMet: true,
    });

    const overTarget = [...atTarget, addTimestamps(createDraft("heart"))];
    expect(summarizeTrainingProgress(overTarget, "heart")).toMatchObject({
      totalCases: 51,
      supervisedCases: 10,
      totalTargetMet: true,
      supervisedTargetMet: true,
    });
  });

  it("filters progress and case mix when changing pathways", () => {
    const heart = createDraft("heart");
    const lung = createDraft("lung");
    lung.caseType = "healthy_volunteer";
    const cases = [addTimestamps(heart), addTimestamps(lung)];

    expect(summarizeTrainingProgress(cases, "heart").totalCases).toBe(1);
    expect(summarizeTrainingProgress(cases, "lung").totalCases).toBe(1);
    expect(summarizeCaseMix(cases, "lung")).toMatchObject({
      clinicalCases: 0,
      healthyVolunteerCases: 1,
      healthyVolunteerPercent: 100,
      healthyVolunteerMaximumPercent: 10,
    });
    expect(cases).toHaveLength(2);
  });
});
