import {
  HEART_FINDINGS,
  HEART_VIEWS,
  type Assessment,
  type CaseDraft,
  type HeartCaseFields,
  type HeartFinding,
} from "../../domain/logbook";

type HeartDraft = Extract<CaseDraft, { pathway: "heart" }>;

interface HeartFormFieldsProps {
  draft: HeartDraft;
  onChange: (draft: CaseDraft) => void;
}

const VENTILATORY_SUPPORT = [
  "Not recorded",
  "None",
  "IPPV",
  "PSV / spontaneous",
  "BiPAP",
  "CPAP / NHF",
];

function toggleItem<T extends string>(values: T[], value: T) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function HeartFormFields({ draft, onChange }: HeartFormFieldsProps) {
  function updateField<K extends keyof HeartCaseFields>(
    key: K,
    value: HeartCaseFields[K],
  ) {
    onChange({ ...draft, [key]: value } as HeartDraft);
  }

  function updateFinding(key: HeartFinding, value: Assessment) {
    onChange({ ...draft, findings: { ...draft.findings, [key]: value } });
  }

  return (
    <div className="structured-content">
      <div className="form-grid structured-top-fields">
        <label className="form-field">
          <span>Ventilatory support</span>
          <select value={draft.ventilatorySupport} onChange={(event) => updateField("ventilatorySupport", event.currentTarget.value)}>
            {VENTILATORY_SUPPORT.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label className="form-field">
          <span>Cardiovascular support <span className="optional-mark">Optional</span></span>
          <input type="text" maxLength={120} value={draft.cardiovascularSupport} onChange={(event) => updateField("cardiovascularSupport", event.currentTarget.value)} />
        </label>
        <label className="form-field">
          <span>Heart rate <span className="optional-mark">Optional</span></span>
          <input type="text" maxLength={40} value={draft.heartRate} onChange={(event) => updateField("heartRate", event.currentTarget.value)} />
        </label>
        <label className="form-field">
          <span>Blood pressure <span className="optional-mark">Optional</span></span>
          <input type="text" maxLength={40} value={draft.bloodPressure} onChange={(event) => updateField("bloodPressure", event.currentTarget.value)} />
        </label>
        <label className="form-field">
          <span>CVP <span className="optional-mark">Optional</span></span>
          <input type="text" maxLength={40} value={draft.centralVenousPressure} onChange={(event) => updateField("centralVenousPressure", event.currentTarget.value)} />
        </label>
      </div>
      <fieldset className="checklist-fieldset">
        <legend>Views obtained</legend>
        <div className="heart-view-list">
          {HEART_VIEWS.map((view) => (
            <label className="check-option" key={view}>
              <input type="checkbox" checked={draft.views.includes(view)} onChange={() => updateField("views", toggleItem(draft.views, view))} />
              <span>{view}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="checklist-fieldset">
        <legend>Assessment findings</legend>
        <div className="heart-findings-list">
          {HEART_FINDINGS.map(([key, label]) => {
            const selected = draft.findings[key] === "unable" ? "not_assessed" : draft.findings[key];
            return (
              <div className="heart-finding-control" key={key}>
                <span className="heart-finding-label">{label}</span>
                <div className="heart-assessment-options" role="group" aria-label={label}>
                  {([ ["yes", "Yes"], ["no", "No"], ["not_assessed", "Not assessed"] ] as const).map(([value, optionLabel]) => (
                    <button className="heart-assessment-option" type="button" key={value} aria-pressed={selected === value} onClick={() => updateFinding(key, value)}>
                      {optionLabel}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
