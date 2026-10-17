import { HD_QUESTIONS, type LogbookCase } from "../../domain/logbook";
type Entry = Extract<LogbookCase, { pathway: "hd" }>;
export function getHdMetrics(cases: Entry[]) {
  return {
    scanDetails: HD_QUESTIONS.map(([key, label]) => ({ label, count: cases.filter((entry) => entry.questionFindings[key] !== "not_assessed").length })),
    findings: HD_QUESTIONS.map(([key, label]) => ({ label, count: cases.filter((entry) => entry.questionFindings[key] === "yes").length })),
  };
}
