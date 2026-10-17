# Public asset credits and rights status

This inventory covers files shipped from `public/`. Do not treat a source citation as permission to redistribute a third-party asset. Resolve entries marked **Unresolved** before publishing a build that includes them.

| Asset | Observed provenance | Rights / release status |
| --- | --- | --- |
| `public/pocus-icon.svg` | Simple CritSono icon markup; present in the initial repository commit and later rebranded in-repo. No external source is recorded. | Appears project-created. Confirm the creator and that it is covered by the project Apache-2.0 license. |
| `public/images/settings-overscroll-portrait.png` | Portrait illustration; added in commit `9613edd` (“Easter Egg”). The repository records no creator, generation/source tool, source prompt, or license. | **Unresolved.** Confirm who created it, the applicable usage terms, and any likeness permission needed; otherwise remove or replace it before public distribution. |
| `public/templates/fusic-heart-report-form-v13.svg` | Added in commit `a9f4ea4` (“ICS Fudge”). The SVG contains the FUSIC® logo and a form based on the FUSIC® Heart Assessment Pack, v13 (2025), published by the Intensive Care Society (ICS): [official pack](https://ics.ac.uk/static/cb70091b-59b9-446b-bce1ea81ed29cbb7/FUSIC-Heart-Assessment-Pack-2025-V13.pdf). | Attribution: FUSIC® and the Intensive Care Society (ICS). **Redistribution rights for the source-derived form and embedded logo are unconfirmed.** |
| `public/templates/fusic-lung-report-form-v10.svg` | Added in commit `3cf919d` (“Lung ICS Fudge”). The report template is based on the FUSIC® Lung Assessment Pack, v10 (2025), published by the Intensive Care Society (ICS): [official pack](https://ics.ac.uk/static/30b580a6-4763-41cf-82003b5ea172d785/FUSIC-Lung-Assessment-Pack-2025-v10.pdf). | Attribution: FUSIC® and the Intensive Care Society (ICS). **Redistribution rights for the source-derived form are unconfirmed.** |
| `public/templates/fusic-abdomen-report-form-v1-2025.svg` and `public/templates/fusic-abdomen-report-form-v1-2025-page2.svg` | Added in commit `da523d4` (“Added Abdomen”). The two-page report form is based on the FUSIC Abdomen v1 (2025) Assessment Pack, published by the Intensive Care Society (ICS). | Attribution: FUSIC® and the Intensive Care Society (ICS). **Redistribution rights for the source-derived form are unconfirmed.** |

## CritSono printouts

The ordinary CritSono single-case report and logbook summary use project-authored layouts in `src/domain/case-print.ts`, `src/domain/logbook-print.ts`, and `src/pathways/*/print.ts`. Those source files are covered by the project Apache-2.0 license. Their generated output is separate from the **ICS form** actions, which use the FUSIC/ICS source-derived report-form templates listed above. User-entered case content in any generated report remains the user's content.

If an asset is replaced, update this table with the replacement's creator/source and license. Keep official source PDFs and assessment packs out of the repository unless redistribution rights are confirmed.
