import type { LogbookCase } from "../../domain/logbook";

export function abdomenCaseSummary(entry: Extract<LogbookCase, { pathway: "abdomen" }>) {
  const hasDetails = entry.examinationPoints.length > 0 || Boolean(
    entry.rightUpperQuadrant || entry.leftUpperQuadrant || entry.rightKidney ||
    entry.leftKidney || entry.bladderDescription || entry.freeFluid || entry.otherComments,
  );
  return hasDetails ? `${entry.examinationPoints.length} examination points recorded` : "Structured details not added";
}
