import { describe, expect, it } from "vitest";
import { createHeartIcsFormPrintDocument } from "./heart-ics-form";
import { createLungIcsFormPrintDocument } from "./lung-ics-form";
import { createAbdomenIcsFormPrintDocument, createAbdomenIcsFormsPrintDocument } from "./abdomen-ics-form";
import { createDraft, type AbdomenCaseFields, type HeartCaseFields, type LungCaseFields } from "./logbook";
import { svgText, svgWrappedText } from "./fusic-forms";

function heartCase(imageQuality: HeartCaseFields["imageQuality"]): HeartCaseFields {
  const draft = createDraft("heart");
  if (draft.pathway !== "heart") throw new Error("Expected Heart case draft");
  return {
    ...draft,
    imageQuality,
    createdAt: "2026-10-17T00:00:00.000Z",
    updatedAt: "2026-10-17T00:00:00.000Z",
  };
}

function lungCase(imageQuality: LungCaseFields["imageQuality"]): LungCaseFields {
  const draft = createDraft("lung");
  if (draft.pathway !== "lung") throw new Error("Expected Lung case draft");
  return {
    ...draft,
    imageQuality,
    createdAt: "2026-10-17T00:00:00.000Z",
    updatedAt: "2026-10-17T00:00:00.000Z",
  };
}

function abdomenCase(imageQuality: AbdomenCaseFields["imageQuality"]): AbdomenCaseFields {
  const draft = createDraft("abdomen");
  if (draft.pathway !== "abdomen") throw new Error("Expected Abdomen case draft");
  return {
    ...draft,
    imageQuality,
    createdAt: "2026-10-17T00:00:00.000Z",
    updatedAt: "2026-10-17T00:00:00.000Z",
  };
}

describe("FUSIC form box layout", () => {
  it("wraps text to box width and clips it to the box height", () => {
    const output = svgWrappedText(
      "alpha beta gamma delta epsilon",
      { x: 10, y: 20, width: 55, height: 48 },
      { size: 10, lineHeight: 24 },
    );

    expect(output.match(/<text /g)).toHaveLength(2);
    expect(output).toContain('width="55" height="48" viewBox="10 20 55 48" overflow="hidden"');
    expect(output).toContain('x="10" y="32"');
    expect(output).toContain('y="56"');
    expect(output).not.toContain("epsilon");
  });

  it("positions single-line text within its box and shrinks long text to fit", () => {
    const output = svgText(
      "LongUnbrokenValue",
      { x: 10, y: 20, width: 30, height: 20 },
      { size: 12, anchor: "middle" },
    );

    expect(output).toContain('x="25" y="30"');
    expect(output).toContain('textLength="30" lengthAdjust="spacingAndGlyphs"');
    expect(output).toContain("LongUnbrokenValue");
    expect(output).toContain('width="30" height="20" viewBox="10 20 30 20" overflow="hidden"');
  });

  it("uses a wider sign-off marker for Heart image quality Acceptable", () => {
    const document = createHeartIcsFormPrintDocument(heartCase("acceptable"));

    expect(document).toContain('<rect x="639" y="643" width="150" height="34"');
  });

  it("places Heart diagnosis and summary in the printed summary area", () => {
    const entry = heartCase("good");
    entry.diagnosis = "Synthetic diagnosis";
    entry.summary = "Synthetic findings summary";
    const document = createHeartIcsFormPrintDocument(entry);

    expect(document).toContain('<text x="615" y="1152"');
    expect(document).toContain("Diagnosis: Synthetic diagnosis");
    expect(document).toContain("Synthetic findings summary");
  });

  it("uses a wider sign-off marker for Lung image quality Acceptable", () => {
    const document = createLungIcsFormPrintDocument(lungCase("acceptable"));

    expect(document).toContain('<rect x="641" y="508" width="160" height="34"');
  });

  it("prints both Abdomen report pages with mapped findings and sign-off areas", () => {
    const entry = abdomenCase("acceptable");
    entry.patientAge = "52";
    entry.patientGender = "Female";
    entry.patientBmi = "24.5";
    entry.indication = "Abdominal pain";
    entry.examinationPoints = ["RUQ (diaphragm and liver)", "Right kidney", "Pelvis (bladder)"];
    entry.rightUpperQuadrant = "Normal liver and diaphragm; no fluid seen.";
    entry.rightHydronephrosis = "mild";
    entry.bladderSize = "small";
    entry.freeFluid = "No free fluid identified.";
    entry.diagnosis = "Synthetic abdominal scan";
    entry.summary = "Structured survey completed for preview.";

    const document = createAbdomenIcsFormPrintDocument(entry, "Sample Operator");

    expect(document).toContain("two-page ICS Abdomen report-form layout");
    expect(document.match(/class="ics-form-sheet"/g)).toHaveLength(2);
    expect(document).toContain("fusic-abdomen-report-form-v1-2025.svg");
    expect(document).toContain("fusic-abdomen-report-form-v1-2025-page2.svg");
    expect(document).toContain("Age 52 · Female · BMI</text>");
    expect(document).toContain(">24.5</text>");
    expect(document).toContain("Sample Operator");
    expect(document).toContain("Abdominal pain");
    expect(document).toContain("Normal liver and diaphragm; no fluid seen.");
    expect(document).toContain('<rect x="654" y="550" width="128" height="32"');
    expect(document).toContain('<rect x="806" y="1102" width="44" height="32"');
    expect(document).toContain('<rect x="736" y="1321" width="60" height="32"');
    expect(document).toContain("Synthetic abdominal scan");
    expect(document).toContain("Structured survey completed for preview.");
  });

  it("builds two Abdomen pages per case in bulk and rejects an empty collection", () => {
    const entries = [abdomenCase("good"), abdomenCase("poor")];
    const document = createAbdomenIcsFormsPrintDocument(entries, "Sample Operator");

    expect(document.match(/class="ics-form-sheet"/g)).toHaveLength(4);
    expect(document).toContain("Two ICS Abdomen report-form pages per saved case (2 cases)");
    expect(() => createAbdomenIcsFormsPrintDocument([])).toThrow(
      "There are no report forms to include in this PDF.",
    );
  });
});
