import type { CaseDraft } from "./logbook";

const TEXT_FIELDS = [
  ["Indication", (draft: CaseDraft) => draft.indication],
  ["Diagnosis / impression", (draft: CaseDraft) => draft.diagnosis],
  ["Summary of findings", (draft: CaseDraft) => draft.summary],
  ["Reflection", (draft: CaseDraft) => draft.reflection],
  ["HD question notes", (draft: CaseDraft) => draft.pathway === "hd" ? Object.values(draft.questionNotes).join(" ") : ""],
  ["HD other comments", (draft: CaseDraft) => draft.pathway === "hd" ? draft.otherComments : ""],
  ["Vascular procedure and site", (draft: CaseDraft) => draft.pathway === "vascular" ? [draft.procedure, draft.insertionSite, draft.lineType, draft.otherComments].join(" ") : ""],
] as const;

const IDENTIFIER_PATTERNS: Array<[string, RegExp]> = [
  ["email address", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
  [
    "phone number",
    /(?:\+\d{1,3}[\s().-]*)?(?:\(?\d{2,5}\)?[\s.-]*)\d{3,4}[\s.-]*\d{3,4}\b/,
  ],
  [
    "patient or record number",
    /\b(?:NHS\s*(?:number|no\.?|#)?|hospital\s*(?:number|no\.?|#)|medical\s*record\s*(?:number|no\.?|#)|MRN|patient\s*(?:ID|number|no\.?|#))\s*[:#-]?\s*[A-Z0-9][A-Z0-9 -]{5,}\b/i,
  ],
  [
    "date of birth",
    /\b(?:DOB|date\s+of\s+birth|born\s+on)\s*[:=-]?\s*(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/i,
  ],
];

/** Returns field labels only; entered text is never copied into the warning. */
export function findPrivacyWarnings(draft: CaseDraft): string[] {
  return TEXT_FIELDS.flatMap(([label, getText]) => {
    const text = getText(draft);
    return IDENTIFIER_PATTERNS.some(([, pattern]) => pattern.test(text))
      ? [label]
      : [];
  });
}
