import {
  ABDOMEN_EXAMINATION_POINTS,
  type AbdomenCaseFields,
  type CaseDraft,
} from "../../domain/logbook";

type AbdomenDraft = Extract<CaseDraft, { pathway: "abdomen" }>;

interface AbdomenFormFieldsProps {
  draft: AbdomenDraft;
  onChange: (draft: CaseDraft) => void;
}

const HYDRONEPHROSIS_LEVELS = [
  "not_assessed",
  "none",
  "mild",
  "moderate",
  "severe",
] as const;
const BLADDER_SIZES = [
  "not_assessed",
  "not_seen",
  "small",
  "normal",
  "large",
] as const;

function formatOption(value: string) {
  return value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

export function AbdomenFormFields({ draft, onChange }: AbdomenFormFieldsProps) {
  function updateField<K extends keyof AbdomenDraft>(
    key: K,
    value: AbdomenDraft[K],
  ) {
    onChange({ ...draft, [key]: value } as AbdomenDraft);
  }

  return (
    <div className="form-grid">
      <fieldset className="checklist-fieldset abdomen-points">
        <legend>Examination points attempted</legend>
        <div className="abdomen-point-list">
          {ABDOMEN_EXAMINATION_POINTS.map((point) => (
            <label className="check-option" key={point}>
              <input
                type="checkbox"
                checked={draft.examinationPoints.includes(point)}
                onChange={(event) =>
                  updateField(
                    "examinationPoints",
                    event.currentTarget.checked
                      ? [...draft.examinationPoints, point]
                      : draft.examinationPoints.filter((item) => item !== point),
                  )
                }
              />
              <span>{point}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="form-field">
        <span>RUQ · diaphragm and liver</span>
        <textarea
          value={draft.rightUpperQuadrant}
          maxLength={500}
          onChange={(event) => updateField("rightUpperQuadrant", event.currentTarget.value)}
        />
      </label>
      <label className="form-field">
        <span>LUQ · diaphragm and spleen</span>
        <textarea
          value={draft.leftUpperQuadrant}
          maxLength={500}
          onChange={(event) => updateField("leftUpperQuadrant", event.currentTarget.value)}
        />
      </label>
      <label className="form-field">
        <span>Right kidney · size and appearance</span>
        <textarea
          value={draft.rightKidney}
          maxLength={500}
          onChange={(event) => updateField("rightKidney", event.currentTarget.value)}
        />
      </label>
      <label className="form-field">
        <span>Right hydronephrosis</span>
        <select
          value={draft.rightHydronephrosis}
          onChange={(event) =>
            updateField(
              "rightHydronephrosis",
              event.currentTarget.value as AbdomenCaseFields["rightHydronephrosis"],
            )
          }
        >
          {HYDRONEPHROSIS_LEVELS.map((value) => (
            <option key={value} value={value}>{formatOption(value)}</option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>Left kidney · size and appearance</span>
        <textarea
          value={draft.leftKidney}
          maxLength={500}
          onChange={(event) => updateField("leftKidney", event.currentTarget.value)}
        />
      </label>
      <label className="form-field">
        <span>Left hydronephrosis</span>
        <select
          value={draft.leftHydronephrosis}
          onChange={(event) =>
            updateField(
              "leftHydronephrosis",
              event.currentTarget.value as AbdomenCaseFields["leftHydronephrosis"],
            )
          }
        >
          {HYDRONEPHROSIS_LEVELS.map((value) => (
            <option key={value} value={value}>{formatOption(value)}</option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>Bladder size</span>
        <select
          value={draft.bladderSize}
          onChange={(event) =>
            updateField(
              "bladderSize",
              event.currentTarget.value as AbdomenCaseFields["bladderSize"],
            )
          }
        >
          {BLADDER_SIZES.map((value) => (
            <option key={value} value={value}>{formatOption(value)}</option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>Bladder location and description</span>
        <textarea
          value={draft.bladderDescription}
          maxLength={500}
          onChange={(event) => updateField("bladderDescription", event.currentTarget.value)}
        />
      </label>
      <label className="form-field">
        <span>Free fluid · location and description</span>
        <textarea
          value={draft.freeFluid}
          maxLength={500}
          onChange={(event) => updateField("freeFluid", event.currentTarget.value)}
        />
      </label>
      <label className="form-field">
        <span>Other comments</span>
        <textarea
          value={draft.otherComments}
          maxLength={500}
          onChange={(event) => updateField("otherComments", event.currentTarget.value)}
        />
      </label>
    </div>
  );
}
