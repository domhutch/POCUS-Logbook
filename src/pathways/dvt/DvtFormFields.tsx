import {
  DVT_SITE_FINDINGS,
  DVT_SITES,
  type Assessment,
  type CaseDraft,
  type DvtSite,
  type DvtSiteFinding,
} from "../../domain/logbook";

type DvtDraft = Extract<CaseDraft, { pathway: "dvt" }>;

interface DvtFormFieldsProps {
  draft: DvtDraft;
  onChange: (draft: CaseDraft) => void;
}

export function DvtFormFields({ draft, onChange }: DvtFormFieldsProps) {
  function updateFinding(site: DvtSite, finding: DvtSiteFinding, value: Assessment) {
    onChange({
      ...draft,
      findings: { ...draft.findings, [site]: { ...draft.findings[site], [finding]: value } },
    });
  }

  function updateOtherComments(value: string) {
    onChange({ ...draft, otherComments: value } as DvtDraft);
  }

  return (
    <div className="dvt-details">
      <p className="case-mix-protocol">Required points include the saphenofemoral junction, common femoral vein, and popliteal vein. Attempt all views; distal views beyond the popliteal trifurcation are optional.</p>
      {DVT_SITES.map((site) => (
        <fieldset className="checklist-fieldset dvt-site" key={site}>
          <legend>{site}</legend>
          <div className="dvt-site-findings">
            {DVT_SITE_FINDINGS.map(([key, label]) => (
              <label className="form-field" key={key}>
                <span>{label}</span>
                <select value={draft.findings[site][key]} onChange={(event) => updateFinding(site, key, event.currentTarget.value as Assessment)}>
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
        <textarea value={draft.otherComments} maxLength={500} onChange={(event) => updateOtherComments(event.currentTarget.value)} />
      </label>
    </div>
  );
}
