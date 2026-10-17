import { describe, expect, it } from "vitest";
import { addTimestamps, createDraft } from "./logbook";
import { createCasesCsv, csvFilename } from "./case-csv";

describe("CSV case export", () => {
  it("exports only the selected pathway with stable columns and no internal IDs", () => {
    const heart = createDraft("heart");
    heart.id = "private-id";
    heart.date = "2026-10-16";
    heart.diagnosis = "LV dilated";
    const lung = createDraft("lung");
    lung.id = "other-id";
    const csv = createCasesCsv([addTimestamps(heart), addTimestamps(lung)], "heart");

    expect(csv).toContain('"Case number","Scan date","Case type"');
    expect(csv).toContain('"1","2026-10-16"');
    expect(csv).toContain('"LV dilated"');
    expect(csv).not.toContain("private-id");
    expect(csv).not.toContain("other-id");
    expect(csv).not.toContain("createdAt");
    expect(csv).not.toContain("updatedAt");
  });

  it("quotes CSV values and neutralizes spreadsheet formulas", () => {
    const draft = createDraft("lung");
    draft.id = "lung-id";
    draft.diagnosis = '=HYPERLINK("https://example.com")';
    draft.summary = 'line one, "quoted"\nline two';
    const csv = createCasesCsv([addTimestamps(draft)], "lung");

    expect(csv).toContain("'=HYPERLINK(\"\"https://example.com\"\")");
    expect(csv).toContain('"line one, ""quoted""\nline two"');
    expect(csv.split("\r\n")).toHaveLength(2);
  });

  it("includes Abdomen demographics in pathway exports", () => {
    const draft = createDraft("abdomen");
    if (draft.pathway !== "abdomen") throw new Error("Expected Abdomen case draft");
    draft.patientAge = "52";
    draft.patientGender = "Female";
    draft.patientBmi = "24.5";

    const csv = createCasesCsv([addTimestamps(draft)], "abdomen");

    expect(csv).toContain('"Age (years)","Gender","BMI","Examination points attempted"');
    expect(csv).toContain('"52","Female","24.5"');
  });

  it("creates pathway-specific dated filenames", () => {
    expect(csvFilename("heart", new Date("2026-10-16T12:00:00.000Z")))
      .toBe("pocus-heart-logbook-2026-10-16.csv");
  });
});
