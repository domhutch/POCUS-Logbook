import { ABDOMEN_EXAMINATION_POINTS, type LogbookCase } from "../../domain/logbook";
type Entry = Extract<LogbookCase, { pathway: "abdomen" }>;
export function getAbdomenMetrics(cases: Entry[]) {
  return {
    scanDetails: ABDOMEN_EXAMINATION_POINTS.map((point) => ({ label: point, count: cases.filter((entry) => entry.examinationPoints.includes(point)).length })),
    findings: [
      { label: "Right kidney details", count: cases.filter((entry) => Boolean(entry.rightKidney)).length },
      { label: "Left kidney details", count: cases.filter((entry) => Boolean(entry.leftKidney)).length },
      { label: "Free fluid field completed", count: cases.filter((entry) => Boolean(entry.freeFluid)).length },
    ],
  };
}
