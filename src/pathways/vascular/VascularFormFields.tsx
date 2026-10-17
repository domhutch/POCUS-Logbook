import {
  VASCULAR_ASSESSMENTS,
  VASCULAR_PROCEDURES,
  type Assessment,
  type CaseDraft,
  type VascularAssessment,
  type VascularCaseFields,
} from "../../domain/logbook";

type VascularDraft = Extract<CaseDraft, { pathway: "vascular" }>;

interface VascularFormFieldsProps {
  draft: VascularDraft;
  onChange: (draft: CaseDraft) => void;
}

export function VascularFormFields({ draft, onChange }: VascularFormFieldsProps) {
  function updateField<K extends keyof VascularCaseFields>(key: K, value: VascularCaseFields[K]) {
    onChange({ ...draft, [key]: value } as VascularDraft);
  }

  function updateAssessment(key: VascularAssessment, value: Assessment) {
    updateField("assessments", { ...draft.assessments, [key]: value });
  }

  return (
    <div className="vascular-details">
      <p className="case-mix-protocol">Use the official FUSIC Vascular reporting form for full documentation. Attempt all required views; document training scans without patient-identifying details and have unverified training findings reviewed by an appropriate trainer.</p>
      <div className="form-grid">
        <label className="form-field">
          <span>Procedure category <span className="required-mark">*</span></span>
          <select value={draft.procedureCategory} required onChange={(event) => updateField("procedureCategory", event.currentTarget.value as VascularCaseFields["procedureCategory"])}>
            {VASCULAR_PROCEDURES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label className="form-field">
          <span>Procedure <span className="optional-mark">Optional</span></span>
          <input type="text" maxLength={500} value={draft.procedure} onChange={(event) => updateField("procedure", event.currentTarget.value)} placeholder="e.g. ultrasound-guided cannulation" />
        </label>
        <label className="form-field">
          <span>Site of insertion <span className="optional-mark">Optional</span></span>
          <input type="text" maxLength={160} value={draft.insertionSite} onChange={(event) => updateField("insertionSite", event.currentTarget.value)} placeholder="e.g. right internal jugular vein" />
        </label>
        <label className="form-field">
          <span>Type of line <span className="optional-mark">Optional</span></span>
          <input type="text" maxLength={160} value={draft.lineType} onChange={(event) => updateField("lineType", event.currentTarget.value)} />
        </label>
        {draft.procedureCategory === "peripheral_access" && (
          <label className="check-option vascular-substitution">
            <input type="checkbox" checked={draft.piccMidlineSubstitution} onChange={(event) => updateField("piccMidlineSubstitution", event.currentTarget.checked)} />
            <span>Count toward the PICC/midline quota as an allowed substitute when PICC/midline scans are unavailable</span>
          </label>
        )}
      </div>
      <fieldset className="checklist-fieldset vascular-assessments">
        <legend>Scan and procedure checks</legend>
        <div className="form-grid">
          {VASCULAR_ASSESSMENTS.map(([key, label]) => (
            <label className="form-field" key={key}>
              <span>{label}</span>
              <select value={draft.assessments[key]} onChange={(event) => updateAssessment(key, event.currentTarget.value as Assessment)}>
                <option value="not_assessed">Not assessed</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="unable">Unable to assess</option>
              </select>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="form-field">
        <span>Comments <span className="optional-mark">Optional</span></span>
        <textarea maxLength={2000} value={draft.otherComments} onChange={(event) => updateField("otherComments", event.currentTarget.value)} />
      </label>
    </div>
  );
}
