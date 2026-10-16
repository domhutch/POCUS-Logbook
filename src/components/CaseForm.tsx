import { useState, type FormEvent } from "react";
import {
  HEART_FINDINGS,
  HEART_VIEWS,
  LUNG_FINDINGS,
  LUNG_REGIONS,
  type Assessment,
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

interface CaseFormProps {
  draft: CaseDraft;
  onChange: (draft: CaseDraft) => void;
  onSave: (draft: CaseDraft) => Promise<boolean>;
  onCancel: () => void;
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

function CaseForm({ draft, onChange, onSave, onCancel }: CaseFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const isNewCase = !("createdAt" in draft);

  function updateField<K extends keyof LungCaseFields | keyof HeartCaseFields>(
    key: K,
    value:
      | LungCaseFields[K & keyof LungCaseFields]
      | HeartCaseFields[K & keyof HeartCaseFields],
  ) {
    onChange({ ...draft, [key]: value } as CaseDraft);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
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
          <p className="eyebrow">{draft.pathway === "lung" ? "Lung" : "Heart"} scan</p>
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

        <details
          className="structured-details optional-details"
          open={
            isNewCase ||
            Boolean(
              draft.indication ||
                draft.diagnosis ||
                draft.impressionCategory !== "not_recorded" ||
                draft.managementImpact !== "not_recorded",
            )
          }
        >
          <summary>Case context and review markers <span>Optional</span></summary>
          <div className="form-grid">
            <label className="form-field">
              <span>Indication <span className="optional-mark">Optional</span></span>
              <input
                type="text"
                maxLength={160}
                placeholder="e.g. breathlessness"
                value={draft.indication}
                onChange={(event) =>
                  updateField("indication", event.currentTarget.value)
                }
              />
            </label>
            <label className="form-field">
              <span>Diagnosis / impression <span className="optional-mark">Optional</span></span>
              <input
                type="text"
                maxLength={160}
                placeholder="A brief, de-identified summary"
                value={draft.diagnosis}
                onChange={(event) =>
                  updateField("diagnosis", event.currentTarget.value)
                }
              />
            </label>
            <label className="form-field">
              <span>Impression category <span className="optional-mark">Optional</span></span>
              <select
                value={draft.impressionCategory}
                onChange={(event) =>
                  updateField(
                    "impressionCategory",
                    event.currentTarget.value as ImpressionCategory,
                  )
                }
              >
                <option value="not_recorded">Not recorded</option>
                <option value="normal">Normal</option>
                <option value="abnormal">Abnormal / pathology</option>
                <option value="indeterminate">Indeterminate</option>
              </select>
            </label>
            <label className="form-field">
              <span>Management impact <span className="optional-mark">Optional</span></span>
              <select
                value={draft.managementImpact}
                onChange={(event) =>
                  updateField(
                    "managementImpact",
                    event.currentTarget.value as ManagementImpact,
                  )
                }
              >
                <option value="not_recorded">Not recorded</option>
                <option value="changed">Changed</option>
                <option value="unchanged">Unchanged</option>
              </select>
            </label>
          </div>
        </details>

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
          <label className="form-field supervisor-field">
            <span>Supervisor name <span className="optional-mark">Optional</span></span>
            <input
              type="text"
              maxLength={100}
              autoComplete="off"
              value={draft.supervisorName}
              onChange={(event) =>
                updateField("supervisorName", event.currentTarget.value)
              }
            />
          </label>
        )}

        <details className="structured-details" open={isNewCase}>
          <summary>Structured scan details <span>Optional</span></summary>
          {draft.pathway === "lung" ? (
            <LungDetails
              draft={draft}
              onUpdateRegion={updateRegion}
              onUpdateVentilation={(value) =>
                updateField("ventilatorySupport", value)
              }
              onUpdateQuality={(value) => updateField("imageQuality", value)}
            />
          ) : (
            <HeartDetails
              draft={draft}
              onUpdateFinding={updateHeartFinding}
              onUpdateViews={(views) => updateField("views", views)}
              onUpdateField={(key, value) => updateField(key, value)}
            />
          )}
        </details>

        <details
          className="structured-details optional-details"
          open={isNewCase || Boolean(draft.summary || draft.reflection)}
        >
          <summary>Notes and reflection <span>Optional</span></summary>
          <div className="form-notes-grid">
            <label className="form-field">
              <span>Summary of findings <span className="optional-mark">Optional</span></span>
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
  onUpdateQuality: (value: ImageQuality) => void;
}

function LungDetails({
  draft,
  onUpdateRegion,
  onUpdateVentilation,
  onUpdateQuality,
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
        <label className="form-field">
          <span>Image quality</span>
          <select
            value={draft.imageQuality}
            onChange={(event) =>
              onUpdateQuality(event.currentTarget.value as ImageQuality)
            }
          >
            <option value="not_recorded">Not recorded</option>
            <option value="good">Good</option>
            <option value="acceptable">Acceptable</option>
            <option value="poor">Poor</option>
          </select>
        </label>
      </div>
      <section className="lung-finding-sections" aria-label="Lung findings by region">
        {LUNG_FINDINGS.map(([key, label]) => (
          <section className="lung-finding-section" key={key}>
            <div className="lung-finding-heading">
              <h3>{label}</h3>
              <p id={`lung-${key}-help`}>
                Choose Yes or No, or leave Not assessed selected.
              </p>
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
