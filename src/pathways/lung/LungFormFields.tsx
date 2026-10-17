import {
  LUNG_FINDINGS,
  LUNG_REGIONS,
  type Assessment,
  type CaseDraft,
  type LungFinding,
  type LungRegion,
} from "../../domain/logbook";

type LungDraft = Extract<CaseDraft, { pathway: "lung" }>;

interface LungFormFieldsProps {
  draft: LungDraft;
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

export function LungFormFields({ draft, onChange }: LungFormFieldsProps) {
  function updateVentilatorySupport(value: string) {
    onChange({ ...draft, ventilatorySupport: value });
  }

  function updateRegion(region: LungRegion, key: LungFinding, value: Assessment) {
    const findings = {
      ...draft.findings,
      [region]: { ...draft.findings[region], [key]: value },
    };
    const regionHasFindings = Object.values(findings[region]).some(
      (assessment) => assessment !== "not_assessed",
    );
    const regions = regionHasFindings
      ? draft.regions.includes(region) ? draft.regions : [...draft.regions, region]
      : draft.regions.filter((recordedRegion) => recordedRegion !== region);
    onChange({ ...draft, findings, regions });
  }

  return (
    <div className="structured-content">
      <div className="form-grid structured-top-fields">
        <label className="form-field">
          <span>Ventilatory support</span>
          <select value={draft.ventilatorySupport} onChange={(event) => updateVentilatorySupport(event.currentTarget.value)}>
            {VENTILATORY_SUPPORT.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>
      <section className="lung-finding-sections" aria-label="Lung findings by region">
        {LUNG_FINDINGS.map(([key, label]) => (
          <section className="lung-finding-section" key={key}>
            <div className="lung-finding-heading">
              <h3>{label}</h3>
              <div className="lung-finding-guidance">
                <p id={`lung-${key}-help`}>Choose Yes or No, or leave Not assessed selected.</p>
                <span>{LUNG_REGIONS.filter((region) => draft.findings[region][key] !== "not_assessed").length} of {LUNG_REGIONS.length} regions recorded</span>
              </div>
            </div>
            <div className="lung-region-responses">
              {LUNG_REGIONS.map((region) => {
                const selected = draft.findings[region][key];
                return (
                  <div className="lung-region-response" key={region}>
                    <strong className="lung-region-label" id={`lung-${key}-${region}`}>{region}</strong>
                    <div className="lung-assessment-options" role="group" aria-labelledby={`lung-${key}-${region}`} aria-describedby={`lung-${key}-help`}>
                      {([ ["yes", "Yes"], ["no", "No"] ] as const).map(([value, optionLabel]) => (
                        <label className="lung-assessment-option" key={value}>
                          <input type="radio" name={`lung-${key}-${region}`} value={value} checked={selected === value} onChange={() => updateRegion(region, key, value)} />
                          <span>{optionLabel}</span>
                        </label>
                      ))}
                      <label className="lung-not-assessed">
                        <input type="checkbox" checked={selected === "not_assessed" || selected === "unable"} onChange={(event) => { if (event.currentTarget.checked) updateRegion(region, key, "not_assessed"); }} />
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
