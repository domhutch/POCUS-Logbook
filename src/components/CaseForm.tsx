import { useState, type FormEvent } from "react";
import {
  DVT_SITES,
  DVT_SITE_FINDINGS,
  VASCULAR_ASSESSMENTS,
  VASCULAR_PROCEDURES,
  PATHWAYS,
  type Assessment,
  type AbdomenCaseFields,
  type DvtCaseFields,
  type DvtSite,
  type DvtSiteFinding,
  type HdCaseFields,
  type VascularCaseFields,
  type VascularAssessment,
  type CaseDraft,
  type CaseType,
  type HeartCaseFields,
  type ImageQuality,
  type ImpressionCategory,
  type LungCaseFields,
  type ManagementImpact,
} from "../domain/logbook";
import { findPrivacyWarnings } from "../domain/privacy-check";
import { AbdomenFormFields } from "../pathways/abdomen/AbdomenFormFields";
import { HeartFormFields } from "../pathways/heart/HeartFormFields";
import { LungFormFields } from "../pathways/lung/LungFormFields";
import { HdFormFields } from "../pathways/hd/HdFormFields";

interface CaseFormProps {
  draft: CaseDraft;
  onChange: (draft: CaseDraft) => void;
  onSave: (draft: CaseDraft) => Promise<boolean>;
  onCancel: () => void;
  supervisors: string[];
}

const VENTILATORY_SUPPORT = [
  "Not recorded",
  "None",
  "IPPV",
  "PSV / spontaneous",
  "BiPAP",
  "CPAP / NHF",
];

function CaseForm({ draft, onChange, onSave, onCancel, supervisors }: CaseFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isEnteringCustomSupervisor, setIsEnteringCustomSupervisor] = useState(
    Boolean(draft.supervisorName && !supervisors.includes(draft.supervisorName)),
  );
  const isNewCase = !("createdAt" in draft);
  const privacyWarnings = findPrivacyWarnings(draft);
  function updateField<K extends keyof LungCaseFields | keyof HeartCaseFields | keyof AbdomenCaseFields | keyof DvtCaseFields | keyof HdCaseFields | keyof VascularCaseFields>(
    key: K,
    value:
      | LungCaseFields[K & keyof LungCaseFields]
      | HeartCaseFields[K & keyof HeartCaseFields]
      | AbdomenCaseFields[K & keyof AbdomenCaseFields]
      | DvtCaseFields[K & keyof DvtCaseFields]
      | HdCaseFields[K & keyof HdCaseFields]
      | VascularCaseFields[K & keyof VascularCaseFields],
  ) {
    onChange({ ...draft, [key]: value } as CaseDraft);
  }

  function updateVascularAssessment(key: VascularAssessment, value: Assessment) {
    if (draft.pathway !== "vascular") return;
    onChange({ ...draft, assessments: { ...draft.assessments, [key]: value } });
  }

  function updateDvtFinding(site: DvtSite, finding: DvtSiteFinding, value: Assessment) {
    if (draft.pathway !== "dvt") return;
    onChange({
      ...draft,
      findings: {
        ...draft.findings,
        [site]: { ...draft.findings[site], [finding]: value },
      },
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    if (
      privacyWarnings.length > 0 &&
      !window.confirm(
        `Possible identifying details were detected in: ${privacyWarnings.join(", ")}. Review these fields and remove any patient-identifying information before saving. Save this case anyway?`,
      )
    ) {
      return;
    }
    setIsSaving(true);
    const saved = await onSave(draft);
    if (!saved) setIsSaving(false);
  }

  function toggleSupervision() {
    onChange({
      ...draft,
      supervised: !draft.supervised,
      supervisorName: draft.supervised ? "" : draft.supervisorName,
    });
  }

  return (
    <section className="entry-form-panel" aria-labelledby="form-title">
      <div className="form-heading">
        <div>
          <p className="eyebrow">{PATHWAYS[draft.pathway].label} scan</p>
          <h2 id="form-title">
            {isNewCase ? "Record a case" : "Edit case"}
          </h2>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={onCancel}
          aria-label="Close case form"
        >
          ×
        </button>
      </div>

      <form onSubmit={(event) => void handleSubmit(event)}>
        <div className="form-grid">
          <label className="form-field">
            <span>Scan date <span className="required-mark">*</span></span>
            <input
              type="date"
              value={draft.date}
              required
              onChange={(event) => updateField("date", event.currentTarget.value)}
            />
          </label>
          <label className="form-field">
            <span>Case type</span>
            <select
              value={draft.caseType}
              onChange={(event) =>
                updateField("caseType", event.currentTarget.value as CaseType)
              }
            >
              <option value="clinical">Clinical scan</option>
              <option value="healthy_volunteer">Healthy volunteer</option>
            </select>
          </label>
        </div>

        <label className="supervision-control">
          <input
            type="checkbox"
            checked={draft.supervised}
            onChange={toggleSupervision}
          />
          <span className="check-indicator" aria-hidden="true" />
          <span>
            <strong>Directly supervised</strong>
            <small>A supervisor was present during this scan</small>
          </span>
        </label>

        {draft.supervised && (
          <div className="supervisor-field">
            <label className="form-field">
              <span>Supervisor name <span className="optional-mark">Optional</span></span>
              <select
                value={draft.supervisorName && !supervisors.includes(draft.supervisorName) ? "__other__" : draft.supervisorName}
                onChange={(event) => {
                  if (event.currentTarget.value === "__other__") {
                    setIsEnteringCustomSupervisor(true);
                    updateField("supervisorName", "");
                  } else {
                    setIsEnteringCustomSupervisor(false);
                    updateField("supervisorName", event.currentTarget.value);
                  }
                }}
              >
                <option value="">Choose a supervisor</option>
                {supervisors.map((name) => <option key={name} value={name}>{name}</option>)}
                <option value="__other__">Enter another name…</option>
              </select>
            </label>
            {(isEnteringCustomSupervisor || supervisors.length === 0) && (
              <label className="form-field supervisor-custom-field">
                <span>{supervisors.length ? "Other supervisor name" : "Supervisor name"}</span>
                <input
                  type="text"
                  maxLength={100}
                  autoComplete="off"
                  value={draft.supervisorName}
                  onChange={(event) => updateField("supervisorName", event.currentTarget.value)}
                />
              </label>
            )}
          </div>
        )}

        <details className="structured-details optional-details" open>
          <summary>Case context and review markers <span>Optional</span></summary>
          <div className="form-grid">
            {(draft.pathway === "heart" || draft.pathway === "lung") && (
              <>
                <label className="form-field">
                  <span>Age (years) <span className="optional-mark">Optional</span></span>
                  <input type="number" min="0" max="120" step="1" value={draft.patientAge} onChange={(event) => updateField("patientAge", event.currentTarget.value)} />
                </label>
                <label className="form-field">
                  <span>Gender <span className="optional-mark">Optional</span></span>
                  <input type="text" maxLength={40} value={draft.patientGender} onChange={(event) => updateField("patientGender", event.currentTarget.value)} />
                </label>
                <label className="form-field">
                  <span>BMI <span className="optional-mark">Optional</span></span>
                  <input type="number" min="0" max="100" step="0.1" value={draft.patientBmi} onChange={(event) => updateField("patientBmi", event.currentTarget.value)} />
                </label>
              </>
            )}
            <label className="form-field">
              <span>Indication <span className="optional-mark">Optional</span></span>
              <input type="text" maxLength={160} placeholder="e.g. breathlessness" value={draft.indication} onChange={(event) => updateField("indication", event.currentTarget.value)} />
            </label>
            <label className="form-field">
              <span>Diagnosis / impression <span className="optional-mark">Optional</span></span>
              <input type="text" maxLength={160} placeholder="A brief, de-identified summary" value={draft.diagnosis} onChange={(event) => updateField("diagnosis", event.currentTarget.value)} />
            </label>
            <label className="form-field">
              <span>Impression category <span className="optional-mark">Optional</span></span>
              <select value={draft.impressionCategory} onChange={(event) => updateField("impressionCategory", event.currentTarget.value as ImpressionCategory)}>
                <option value="not_recorded">Not recorded</option>
                <option value="normal">Normal</option>
                <option value="abnormal">Abnormal / pathology</option>
                <option value="indeterminate">Indeterminate</option>
              </select>
            </label>
            <label className="form-field">
              <span>Management impact <span className="optional-mark">Optional</span></span>
              <select value={draft.managementImpact} onChange={(event) => updateField("managementImpact", event.currentTarget.value as ManagementImpact)}>
                <option value="not_recorded">Not recorded</option>
                <option value="changed">Changed</option>
                <option value="unchanged">Unchanged</option>
              </select>
            </label>
            <label className="form-field">
              <span>Image quality <span className="optional-mark">Optional</span></span>
              <select value={draft.imageQuality} onChange={(event) => updateField("imageQuality", event.currentTarget.value as ImageQuality)}>
                <option value="not_recorded">Not recorded</option>
                <option value="good">Good</option>
                <option value="acceptable">Acceptable</option>
                <option value="poor">Poor</option>
              </select>
            </label>
          </div>
          {(draft.pathway === "heart" || draft.pathway === "lung") && <p className="privacy-note">Demographics are stored with this case and included in exports. Do not enter patient names, dates of birth, or record numbers.</p>}
        </details>

        <details className="structured-details" open>
          <summary>Structured scan details <span>Optional</span></summary>
          {draft.pathway === "lung" ? (
            <LungFormFields draft={draft} onChange={onChange} />
          ) : draft.pathway === "heart" ? (
            <HeartFormFields draft={draft} onChange={onChange} />
          ) : draft.pathway === "abdomen" ? (
            <AbdomenFormFields draft={draft} onChange={onChange} />
          ) : draft.pathway === "dvt" ? (
            <div className="dvt-details">
              <p className="case-mix-protocol">Required points include the saphenofemoral junction, common femoral vein, and popliteal vein. Attempt all views; distal views beyond the popliteal trifurcation are optional.</p>
              {DVT_SITES.map((site) => (
                <fieldset className="checklist-fieldset dvt-site" key={site}>
                  <legend>{site}</legend>
                  <div className="dvt-site-findings">
                    {DVT_SITE_FINDINGS.map(([key, label]) => (
                      <label className="form-field" key={key}>
                        <span>{label}</span>
                        <select
                          value={draft.findings[site][key]}
                          onChange={(event) => updateDvtFinding(site, key, event.currentTarget.value as Assessment)}
                        >
                          <option value="not_assessed">Not assessed</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                          <option value="unable">Unable to assess</option>
                        </select>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              <label className="form-field">
                <span>Other comments <span className="optional-mark">Optional</span></span>
                <textarea value={draft.otherComments} maxLength={500} onChange={(event) => updateField("otherComments", event.currentTarget.value)} />
              </label>
            </div>
          ) : draft.pathway === "hd" ? (
            <HdFormFields draft={draft} onChange={onChange} />
          ) : (
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
                {draft.procedureCategory === "peripheral_access" && <label className="check-option vascular-substitution">
                  <input type="checkbox" checked={draft.piccMidlineSubstitution} onChange={(event) => updateField("piccMidlineSubstitution", event.currentTarget.checked)} />
                  <span>Count toward the PICC/midline quota as an allowed substitute when PICC/midline scans are unavailable</span>
                </label>}
              </div>
              <fieldset className="checklist-fieldset vascular-assessments">
                <legend>Scan and procedure checks</legend>
                <div className="form-grid">
                  {VASCULAR_ASSESSMENTS.map(([key, label]) => (
                    <label className="form-field" key={key}>
                      <span>{label}</span>
                      <select value={draft.assessments[key]} onChange={(event) => updateVascularAssessment(key, event.currentTarget.value as Assessment)}>
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
          )}
        </details>

        <details className="structured-details optional-details" open>
          <summary>Notes and reflection <span>Optional</span></summary>
          <div className="form-notes-grid">
            <label className="form-field">
              <span>{draft.pathway === "dvt" ? "Conclusion, clinical significance and suggested actions" : "Summary of findings"} <span className="optional-mark">Optional</span></span>
              <textarea
                rows={3}
                maxLength={2000}
                placeholder="Findings, conclusion and any suggested follow-up"
                value={draft.summary}
                onChange={(event) =>
                  updateField("summary", event.currentTarget.value)
                }
              />
            </label>
            <label className="form-field">
              <span>Reflection <span className="optional-mark">Optional</span></span>
              <textarea
                rows={3}
                maxLength={2000}
                placeholder="What went well? What would you review or practise?"
                value={draft.reflection}
                onChange={(event) =>
                  updateField("reflection", event.currentTarget.value)
                }
              />
            </label>
          </div>
        </details>

        <p className="form-privacy">
          Keep this record de-identified. Don’t enter patient names, dates of
          birth, hospital numbers, or other identifying details.
        </p>
        {privacyWarnings.length > 0 && (
          <p className="privacy-warning" role="status">
            Possible identifying details detected in {privacyWarnings.join(", ")}.
            Review and remove patient-identifying information before saving.
            Clinical wording is not checked as identifying information, and
            names may not be detected automatically.
          </p>
        )}
        <div className="form-actions">
          <button
            className="button button-secondary"
            type="button"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button className="button button-primary" type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save case"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default CaseForm;
