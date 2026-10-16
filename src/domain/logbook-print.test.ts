import { describe, expect, it } from "vitest";
import { addTimestamps, createDraft } from "./logbook";
import { createLogbookPrintDocument } from "./logbook-print";

describe("printable logbook", () => {
  it("matches the Heart training-log table layout and leaves blank target rows", () => {
    const document = createLogbookPrintDocument([], "heart");

    expect(document).toContain("Study<br>No.");
    expect(document).toContain("Date</th>");
    expect(document).toContain("Diagnosis</th>");
    expect(document).toContain("Summary of main findings</th>");
    expect(document).toContain("Supervisor</th>");
    expect(document.match(/class="empty-row"/g)).toHaveLength(50);
    expect(document.match(/class="logbook-page"/g)).toHaveLength(3);
  });

  it("fills the Lung layout with de-identified case fields and handles extra cases", () => {
    const cases = Array.from({ length: 31 }, (_, index) => {
      const draft = createDraft("lung");
      draft.id = `lung-${index + 1}`;
      draft.date = "2026-10-16";
      draft.diagnosis = index === 0 ? "Small <pleural> effusion" : `Finding ${index + 1}`;
      draft.summary = index === 0 ? "B-lines & sliding" : "";
      return addTimestamps(draft);
    });
    const document = createLogbookPrintDocument(cases, "lung");

    expect(document).toContain("Supervisor</th>");
    expect(document).toContain("16/10/2026");
    expect(document).toContain("Small &lt;pleural&gt; effusion");
    expect(document).toContain("B-lines &amp; sliding");
    expect(document.match(/class="filled-row/g)).toHaveLength(31);
    expect(document.match(/class="logbook-page"/g)).toHaveLength(4);
  });
});
