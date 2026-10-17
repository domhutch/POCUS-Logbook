import { describe, expect, it } from "vitest";
import { addTimestamps, createDraft } from "./logbook";
import {
  createCasePrintDocument,
  createCaseReportsPrintDocument,
} from "./case-print";

describe("printable case sheets", () => {
  it("includes pathway-specific Lung findings and escapes user text", () => {
    const draft = createDraft("lung");
    if (draft.pathway !== "lung") throw new Error("Expected Lung case draft");
    draft.indication = "<script>alert('x')</script>";
    draft.date = "2026-10-01";
    draft.regions = ["Right upper anterior"];
    draft.findings["Right upper anterior"].lungSliding = "yes";
    draft.regions.push("Left lower anterior");
    draft.findings["Left lower anterior"].pleuralEffusion = "unable";

    const document = createCasePrintDocument(addTimestamps(draft));

    expect(document).toContain("Lung");
    expect(document).toContain(">01/10/2026</span>");
    expect(document).toContain("@page { size: A4 portrait; margin: 8mm; }");
    expect(document).toContain("const printableHeight = 275 * 96 / 25.4");
    expect(document).toContain('class="report-table lung-table"');
    expect(document).toContain('<th scope="col">Lung sliding</th>');
    expect(document).toContain("Right upper anterior");
    expect(document).toContain("Left lower anterior");
    expect(document).toContain("Pleural effusion");
    expect(document).toContain("U/A");
    expect(document).toContain("Lung sliding");
    expect(document).toContain("&lt;script&gt;");
    expect(document).not.toContain("<script>alert");
  });

  it("includes Heart views, measurements, and assessment findings", () => {
    const draft = createDraft("heart");
    if (draft.pathway !== "heart") throw new Error("Expected Heart case draft");
    draft.views = ["PLAX"];
    draft.heartRate = "82";
    draft.findings.lvDilated = "no";

    const document = createCasePrintDocument(addTimestamps(draft));

    expect(document).toContain("Assessment findings");
    expect(document).toContain("PLAX");
    expect(document).toContain("Heart rate");
    expect(document).toContain("82");
    expect(document).toContain('class="report-table heart-table"');
    expect(document).toContain('<strong class="selected">No</strong>');
    expect(document).toContain("LV dilated");
  });

  it("includes Abdomen demographics and findings", () => {
    const draft = createDraft("abdomen");
    if (draft.pathway !== "abdomen") throw new Error("Expected Abdomen case draft");
    draft.patientAge = "52";
    draft.patientGender = "Female";
    draft.patientBmi = "24.5";
    draft.rightUpperQuadrant = "Synthetic RUQ finding";

    const document = createCasePrintDocument(addTimestamps(draft));

    expect(document).toContain('<span class="field-label">Age (years)</span>');
    expect(document).toContain("Synthetic RUQ finding");
  });
});

describe("combined case report PDFs", () => {
  it("includes one printable sheet per selected-pathway case", () => {
    const first = createDraft("heart");
    first.date = "2026-10-01";
    first.diagnosis = "First report";
    const second = createDraft("heart");
    second.date = "2026-10-02";
    second.diagnosis = "Second report";
    const otherPathway = createDraft("lung");
    otherPathway.diagnosis = "Must not appear";

    const document = createCaseReportsPrintDocument(
      [addTimestamps(first), addTimestamps(otherPathway), addTimestamps(second)],
      "heart",
    );

    expect(document).toContain("Heart case reports");
    expect(document.match(/<main class="sheet">/g)).toHaveLength(2);
    expect(document).toContain("First report");
    expect(document).toContain("Second report");
    expect(document).not.toContain("Must not appear");
    expect(document).toContain(".report-collection .sheet { margin: 0 auto; break-after: page;");
    expect(document).toContain(".report-collection .sheet:last-child { break-after: auto;");
  });

  it("reports when the selected pathway has no cases", () => {
    expect(() => createCaseReportsPrintDocument([], "heart")).toThrow(
      "There are no saved cases to include in this PDF.",
    );
  });
});
