import { describe, expect, it } from "vitest";
import { createHeartIcsFormPrintDocument } from "./heart-ics-form";
import { createLungIcsFormPrintDocument } from "./lung-ics-form";
import { createDraft, type HeartCaseFields, type LungCaseFields } from "./logbook";
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

describe("FUSIC form box layout", () => {
  it("wraps text to box width and clips it to the box height", () => {
    const output = svgWrappedText(
      "alpha beta gamma delta epsilon",
      { x: 10, y: 20, width: 55, height: 48 },
      { size: 10, lineHeight: 24 },
    );

    expect(output.match(/<text /g)).toHaveLength(2);
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
});
