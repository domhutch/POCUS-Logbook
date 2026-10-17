import { HD_QUESTIONS, type LogbookCase } from "../../domain/logbook";

export function hdCaseSummary(entry: Extract<LogbookCase, { pathway: "hd" }>) {
  const hasDetails = Object.values(entry.questionFindings).some((finding) => finding !== "not_assessed") ||
    Object.values(entry.measurements).some(Boolean) || Boolean(entry.otherComments);
  const reviewedQuestions = HD_QUESTIONS.filter(([key]) => entry.questionFindings[key] !== "not_assessed").length;
  return hasDetails ? `${reviewedQuestions} clinical questions reviewed` : "Structured details not added";
}
