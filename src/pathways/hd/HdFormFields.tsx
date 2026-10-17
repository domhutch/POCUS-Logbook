import {
  HD_MEASUREMENTS,
  HD_QUESTIONS,
  type Assessment,
  type CaseDraft,
  type HdCaseFields,
  type HdQuestion,
} from "../../domain/logbook";

type HdDraft = Extract<CaseDraft, { pathway: "hd" }>;

interface HdFormFieldsProps {
  draft: HdDraft;
  onChange: (draft: CaseDraft) => void;
}

export function HdFormFields({ draft, onChange }: HdFormFieldsProps) {
  function updateField<K extends keyof HdCaseFields>(
    key: K,
    value: HdCaseFields[K],
  ) {
    onChange({ ...draft, [key]: value } as HdDraft);
  }

  function updateQuestion(question: HdQuestion, value: Assessment) {
    updateField("questionFindings", { ...draft.questionFindings, [question]: value });
  }

  function updateQuestionNote(question: HdQuestion, value: string) {
    updateField("questionNotes", { ...draft.questionNotes, [question]: value });
  }

  return (
    <div className="hd-details">
      <p className="case-mix-protocol">Attempt the FUSIC HD minimum dataset where possible. This form reflects the revised dataset for scans from 1 February 2026; use the official reporting form and trainer guidance for full requirements.</p>
      <fieldset className="checklist-fieldset hd-questions">
        <legend>Ten clinical questions</legend>
        {HD_QUESTIONS.map(([key, question]) => (
          <div className="hd-question" key={key}>
            <label className="form-field">
              <span>{question}</span>
              <select value={draft.questionFindings[key]} onChange={(event) => updateQuestion(key, event.currentTarget.value as Assessment)}>
                <option value="not_assessed">Not assessed</option>
                <option value="no">No</option>
                <option value="yes">Yes</option>
                <option value="unable">Unable to assess</option>
              </select>
            </label>
            <label className="form-field">
              <span>Key findings <span className="optional-mark">Optional</span></span>
              <input type="text" maxLength={500} value={draft.questionNotes[key]} onChange={(event) => updateQuestionNote(key, event.currentTarget.value)} />
            </label>
          </div>
        ))}
      </fieldset>
      <fieldset className="checklist-fieldset hd-measurements">
        <legend>Measurements and Doppler</legend>
        <p>Record values and interpretation as documented on the scan. Fields are optional when not obtained or not applicable.</p>
        <div className="form-grid">
          {HD_MEASUREMENTS.map(([key, label]) => (
            <label className="form-field" key={key}>
              <span>{label}</span>
              <input type="text" maxLength={120} value={draft.measurements[key]} onChange={(event) => updateField("measurements", { ...draft.measurements, [key]: event.currentTarget.value })} />
            </label>
          ))}
        </div>
      </fieldset>
      <label className="form-field">
        <span>Other comments <span className="optional-mark">Optional</span></span>
        <textarea maxLength={2000} value={draft.otherComments} onChange={(event) => updateField("otherComments", event.currentTarget.value)} />
      </label>
    </div>
  );
}
