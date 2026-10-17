import { useState, type FormEvent } from "react";
import {
  HEART_FINDINGS,
  HEART_VIEWS,
  ABDOMEN_EXAMINATION_POINTS,
  DVT_SITES,
  DVT_SITE_FINDINGS,
  HD_QUESTIONS,
  HD_MEASUREMENTS,
  VASCULAR_ASSESSMENTS,
  VASCULAR_PROCEDURES,
  PATHWAYS,
  LUNG_FINDINGS,
  LUNG_REGIONS,
  type Assessment,
  type AbdomenCaseFields,
  type DvtCaseFields,
  type DvtSite,
  type DvtSiteFinding,
  type HdCaseFields,
  type VascularCaseFields,
  type VascularAssessment,
  type HdQuestion,
  type CaseDraft,
  type CaseType,
  type HeartCaseFields,
  type HeartFinding,
  type HeartView,
  type ImageQuality,
  type ImpressionCategory,
  type LungCaseFields,
  type LungFinding,
  type LungRegion,
  type ManagementImpact,
} from "../domain/logbook";
import { findPrivacyWarnings } from "../domain/privacy-check";

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

function updateArrayItem<T extends string>(values: T[], value: T) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

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

  function updateRegion(
    region: LungRegion,
    key: LungFinding,
    value: Assessment,
  ) {
    if (draft.pathway !== "lung") return;
    const nextFindings = {
      ...draft.findings,
      [region]: { ...draft.findings[region], [key]: value },
    };
    const hasRecordedFinding = Object.values(nextFindings[region]).some(
      (assessment) => assessment !== "not_assessed",
    );
    const nextRegions = hasRecordedFinding
      ? draft.regions.includes(region)
        ? draft.regions
        : [...draft.regions, region]
      : draft.regions.filter((recordedRegion) => recordedRegion !== region);
    onChange({ ...draft, findings: nextFindings, regions: nextRegions });
  }

  function updateHeartFinding(key: HeartFinding, value: Assessment) {
    if (draft.pathway !== "heart") return;
    onChange({
      ...draft,
      findings: { ...draft.findings, [key]: value },
    });
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

  function updateHdQuestion(question: HdQuestion, value: Assessment) {
    if (draft.pathway !== "hd") return;
    onChange({ ...draft, questionFindings: { ...draft.questionFindings, [question]: value } });
  }

  function updateHdQuestionNote(question: HdQuestion, value: string) {
    if (draft.pathway !== "hd") return;
    onChange({ ...draft, questionNotes: { ...draft.questionNotes, [question]: value } });
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
        </details>

        <details className="structured-details" open>
          <summary>Structured scan details <span>Optional</span></summary>
          {draft.pathway === "lung" ? (
            <LungDetails
              draft={draft}
              onUpdateRegion={updateRegion}
              onUpdateVentilation={(value) =>
                updateField("ventilatorySupport", value)
              }
            />
          ) : draft.pathway === "heart" ? (
            <HeartDetails
              draft={draft}
              onUpdateFinding={updateHeartFinding}
              onUpdateViews={(views) => updateField("views", views)}
              onUpdateField={(key, value) => updateField(key, value)}
            />
          ) : draft.pathway === "abdomen" ? (
            <div className="form-grid">
              <fieldset className="checklist-fieldset abdomen-points">
                <legend>Examination points attempted</legend>
                <div className="abdomen-point-list">
                  {ABDOMEN_EXAMINATION_POINTS.map((point) => (
                    <label className="check-option" key={point}>
                      <input
                        type="checkbox"
                        checked={draft.examinationPoints.includes(point)}
                        onChange={(event) => updateField(
                          "examinationPoints",
                          event.currentTarget.checked
                            ? [...draft.examinationPoints, point]
                            : draft.examinationPoints.filter((item) => item !== point),
                        )}
                      />
                      <span>{point}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="form-field">
                <span>RUQ · diaphragm and liver</span>
                <textarea value={draft.rightUpperQuadrant} maxLength={500} onChange={(event) => updateField("rightUpperQuadrant", event.currentTarget.value)} />
              </label>
              <label className="form-field">
                <span>LUQ · diaphragm and spleen</span>
                <textarea value={draft.leftUpperQuadrant} maxLength={500} onChange={(event) => updateField("leftUpperQuadrant", event.currentTarget.value)} />
              </label>
              <label className="form-field">
                <span>Right kidney · size and appearance</span>
                <textarea value={draft.rightKidney} maxLength={500} onChange={(event) => updateField("rightKidney", event.currentTarget.value)} />
              </label>
              <label className="form-field">
                <span>Right hydronephrosis</span>
                <select value={draft.rightHydronephrosis} onChange={(event) => updateField("rightHydronephrosis", event.currentTarget.value as AbdomenCaseFields["rightHydronephrosis"])}>
                  {["not_assessed", "none", "mild", "moderate", "severe"].map((value) => <option key={value} value={value}>{value === "not_assessed" ? "Not assessed" : value === "none" ? "None" : value[0].toUpperCase() + value.slice(1)}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span>Left kidney · size and appearance</span>
                <textarea value={draft.leftKidney} maxLength={500} onChange={(event) => updateField("leftKidney", event.currentTarget.value)} />
              </label>
              <label className="form-field">
                <span>Left hydronephrosis</span>
                <select value={draft.leftHydronephrosis} onChange={(event) => updateField("leftHydronephrosis", event.currentTarget.value as AbdomenCaseFields["leftHydronephrosis"])}>
                  {["not_assessed", "none", "mild", "moderate", "severe"].map((value) => <option key={value} value={value}>{value === "not_assessed" ? "Not assessed" : value === "none" ? "None" : value[0].toUpperCase() + value.slice(1)}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span>Bladder size</span>
                <select value={draft.bladderSize} onChange={(event) => updateField("bladderSize", event.currentTarget.value as AbdomenCaseFields["bladderSize"])}>
                  {["not_assessed", "not_seen", "small", "normal", "large"].map((value) => <option key={value} value={value}>{value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase())}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span>Bladder location and description</span>
                <textarea value={draft.bladderDescription} maxLength={500} onChange={(event) => updateField("bladderDescription", event.currentTarget.value)} />
              </label>
              <label className="form-field">
                <span>Free fluid · location and description</span>
                <textarea value={draft.freeFluid} maxLength={500} onChange={(event) => updateField("freeFluid", event.currentTarget.value)} />
              </label>
              <label className="form-field">
                <span>Other comments</span>
                <textarea value={draft.otherComments} maxLength={500} onChange={(event) => updateField("otherComments", event.currentTarget.value)} />
              </label>
            </div>
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
            <div className="hd-details">
              <p className="case-mix-protocol">Attempt the FUSIC HD minimum dataset where possible. This form reflects the revised dataset for scans from 1 February 2026; use the official reporting form and trainer guidance for full requirements.</p>
              <fieldset className="checklist-fieldset hd-questions">
                <legend>Ten clinical questions</legend>
                {HD_QUESTIONS.map(([key, question]) => (
                  <div className="hd-question" key={key}>
                    <label className="form-field">
                      <span>{question}</span>
                      <select value={draft.questionFindings[key]} onChange={(event) => updateHdQuestion(key, event.currentTarget.value as Assessment)}>
                        <option value="not_assessed">Not assessed</option>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                        <option value="unable">Unable to assess</option>
                      </select>
                    </label>
                    <label className="form-field">
                      <span>Key findings <span className="optional-mark">Optional</span></span>
                      <input type="text" maxLength={500} value={draft.questionNotes[key]} onChange={(event) => updateHdQuestionNote(key, event.currentTarget.value)} />
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

interface LungDetailsProps {
  draft: Extract<CaseDraft, { pathway: "lung" }>;
  onUpdateRegion: (
    region: LungRegion,
    key: LungFinding,
    value: Assessment,
  ) => void;
  onUpdateVentilation: (value: string) => void;
}

function LungDetails({
  draft,
  onUpdateRegion,
  onUpdateVentilation,
}: LungDetailsProps) {
  return (
    <div className="structured-content">
      <div className="form-grid structured-top-fields">
        <label className="form-field">
          <span>Ventilatory support</span>
          <select
            value={draft.ventilatorySupport}
            onChange={(event) => onUpdateVentilation(event.currentTarget.value)}
          >
            {VENTILATORY_SUPPORT.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>
      <section className="lung-finding-sections" aria-label="Lung findings by region">
        {LUNG_FINDINGS.map(([key, label]) => (
          <section className="lung-finding-section" key={key}>
            <div className="lung-finding-heading">
              <h3>{label}</h3>
              <div className="lung-finding-guidance">
                <p id={`lung-${key}-help`}>
                  Choose Yes or No, or leave Not assessed selected.
                </p>
                <span>
                  {LUNG_REGIONS.filter((region) => draft.findings[region][key] !== "not_assessed").length} of {LUNG_REGIONS.length} regions recorded
                </span>
              </div>
            </div>
            <div className="lung-region-responses">
              {LUNG_REGIONS.map((region) => {
                const selected = draft.findings[region][key];
                return (
                  <div
                    className="lung-region-response"
                    key={region}
                  >
                    <strong className="lung-region-label" id={`lung-${key}-${region}`}>
                      {region}
                    </strong>
                    <div
                      className="lung-assessment-options"
                      role="group"
                      aria-labelledby={`lung-${key}-${region}`}
                      aria-describedby={`lung-${key}-help`}
                    >
                      {(
                        [
                          ["yes", "Yes"],
                          ["no", "No"],
                        ] as const
                      ).map(([value, optionLabel]) => (
                        <label className="lung-assessment-option" key={value}>
                          <input
                            type="radio"
                            name={`lung-${key}-${region}`}
                            value={value}
                            checked={selected === value}
                            onChange={() => onUpdateRegion(region, key, value)}
                          />
                          <span>{optionLabel}</span>
                        </label>
                      ))}
                      <label className="lung-not-assessed">
                        <input
                          type="checkbox"
                          checked={selected === "not_assessed" || selected === "unable"}
                          onChange={(event) => {
                            if (event.currentTarget.checked) {
                              onUpdateRegion(region, key, "not_assessed");
                            }
                          }}
                        />
                        <span>Not assessed</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </section>
    </div>
  );
}

interface HeartDetailsProps {
  draft: Extract<CaseDraft, { pathway: "heart" }>;
  onUpdateFinding: (key: HeartFinding, value: Assessment) => void;
  onUpdateViews: (views: HeartView[]) => void;
  onUpdateField: <K extends keyof HeartCaseFields>(
    key: K,
    value: HeartCaseFields[K],
  ) => void;
}

function HeartDetails({
  draft,
  onUpdateFinding,
  onUpdateViews,
  onUpdateField,
}: HeartDetailsProps) {
  return (
    <div className="structured-content">
      <div className="form-grid structured-top-fields">
        <label className="form-field">
          <span>Ventilatory support</span>
          <select
            value={draft.ventilatorySupport}
            onChange={(event) =>
              onUpdateField("ventilatorySupport", event.currentTarget.value)
            }
          >
            {VENTILATORY_SUPPORT.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Cardiovascular support <span className="optional-mark">Optional</span></span>
          <input
            type="text"
            maxLength={120}
            value={draft.cardiovascularSupport}
            onChange={(event) =>
              onUpdateField("cardiovascularSupport", event.currentTarget.value)
            }
          />
        </label>
        <label className="form-field">
          <span>Heart rate <span className="optional-mark">Optional</span></span>
          <input
            type="text"
            maxLength={40}
            value={draft.heartRate}
            onChange={(event) =>
              onUpdateField("heartRate", event.currentTarget.value)
            }
          />
        </label>
        <label className="form-field">
          <span>Blood pressure <span className="optional-mark">Optional</span></span>
          <input
            type="text"
            maxLength={40}
            value={draft.bloodPressure}
            onChange={(event) =>
              onUpdateField("bloodPressure", event.currentTarget.value)
            }
          />
        </label>
        <label className="form-field">
          <span>CVP <span className="optional-mark">Optional</span></span>
          <input
            type="text"
            maxLength={40}
            value={draft.centralVenousPressure}
            onChange={(event) =>
              onUpdateField("centralVenousPressure", event.currentTarget.value)
            }
          />
        </label>
      </div>
      <fieldset className="checklist-fieldset">
        <legend>Views obtained</legend>
        <div className="heart-view-list">
          {HEART_VIEWS.map((view) => (
            <label className="check-option" key={view}>
              <input
                type="checkbox"
                checked={draft.views.includes(view)}
                onChange={() =>
                  onUpdateViews(updateArrayItem(draft.views, view))
                }
              />
              <span>{view}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="checklist-fieldset">
        <legend>Assessment findings</legend>
        <div className="heart-findings-list">
          {HEART_FINDINGS.map(([key, label]) => {
            const selected =
              draft.findings[key] === "unable"
                ? "not_assessed"
                : draft.findings[key];
            return (
              <div className="heart-finding-control" key={key}>
                <span className="heart-finding-label">{label}</span>
                <div
                  className="heart-assessment-options"
                  role="group"
                  aria-label={label}
                >
                  {(
                    [
                      ["yes", "Yes"],
                      ["no", "No"],
                      ["not_assessed", "Not assessed"],
                    ] as const
                  ).map(([value, optionLabel]) => (
                    <button
                      className="heart-assessment-option"
                      type="button"
                      key={value}
                      aria-pressed={selected === value}
                      onClick={() => onUpdateFinding(key, value)}
                    >
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

export default CaseForm;
