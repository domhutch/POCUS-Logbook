# Open-source and modularity review

Review date: 17 October 2026

This is a practical repository review, not legal advice or a complete compliance audit. Dependency findings are based on the checked-in `package-lock.json` and license metadata in the installed packages. Recheck before publishing a release.

## Current assessment

The project is already built on open-source packages and has a recognizable modular structure. The direct runtime packages declare MIT or ISC licenses: React, Capacitor, html2canvas, jsPDF, and idb. The development toolchain is also made up of open-source packages. The lockfile contains 522 installed packages and no missing license metadata in the current install. License metadata includes MIT, ISC, Apache-2.0, BSD, BlueOak-1.0.0, CC-BY-4.0, and MPL-2.0/Apache-2.0 options; those less familiar entries and redistribution notices still deserve a release-time review.

The repository itself declares Apache-2.0 and includes the license text. The README distinguishes project code from ICS curriculum materials and links to their sources. The `Source Material/` and `curriculum/` directories are excluded from Git, which helps avoid accidentally redistributing supplied documents.

Code is divided into `domain`, `storage`, `cloud`, `hooks`, and `components`. Domain rules and export generation are mostly separated from React and browser storage. The tests cover domain calculations, backup behavior, storage behavior, and selected document formats. This is a real structure to build on, not an unstructured single-file prototype.

## Gaps and suggested improvements

| Priority | Finding | Suggested improvement | Difficulty |
| --- | --- | --- | --- |
| Before distributing builds | The lockfile records license metadata, but there is no generated third-party license/notice report for shipped bundles. Asset provenance is also not documented alongside each asset. | Generate and review a dependency license inventory; identify which notices must accompany web/native distributions. Record the source and license for icons and images in an asset credits file. | Moderate |
| Before accepting pull requests | The GitHub workflow runs checks on pushes to `main` and manual dispatch, but there is no pull-request validation workflow. Actions are referenced by version tags rather than immutable commit SHAs. | Add a PR workflow that runs `npm ci` and `npm run check`; pin actions to verified SHAs and keep readable version comments. | Easy to moderate |
| Maintainability | `src/App.tsx` still coordinates navigation and several app workflows; `src/components/CaseForm.tsx` and `CaseReview.tsx` branch on pathway; `src/domain/metrics.ts`, `case-csv.ts`, and `case-print.ts` also contain pathway-specific branches; `src/styles.css` is a large global stylesheet. | Extract pathway-owned case behavior behind small feature modules and keep shared shells in the logbook UI. Move one seam at a time and keep serialized data stable. | Moderate to difficult |
| Test confidence | Domain, persistence, backup, and export formats have automated tests. Browser-dependent flows such as save feedback, print preview, and actual file delivery do not have UI-level regression coverage. | Add component/browser tests only for concrete regressions or release-critical flows; avoid a large test stack without a use case. | Moderate |
| Contributor readability | `CONTRIBUTING.md` now documents setup, code boundaries, migrations, and privacy. A worked guide for adding a pathway or curriculum profile would make extension easier. | Add a concise extension guide after the module contracts are established, with one end-to-end example and required tests. | Easy |

## Important licensing boundary

The app links to and summarizes selected ICS curriculum requirements, while official training and assessment documents remain under their own rights and are excluded from the repository. Continue to keep official PDFs and supplied source packs out of commits and generated public bundles unless redistribution rights are confirmed. The package-license inventory does not resolve rights for curriculum content, fonts, images, or other non-package assets.

## Modularity boundaries

- `src/domain/`: case types, pathway rules, validation, metrics, and export document generation. Keep this independent of React and IndexedDB.
- `src/storage/`: IndexedDB schema, migrations, and persistence. Keep schema changes paired with migration tests.
- `src/cloud/`: provider-specific encrypted backup transport. Keep OAuth/provider behavior out of the domain model.
- `src/hooks/`: app workflows that coordinate domain operations and UI state.
- `src/components/`: screens and form controls.

The current form/report modules for Heart and Lung show the start of modality-owned code, but most case behavior is still spread across pathway branches in the form, review, case list, metrics, backup validation, CSV, and PDF modules.

## Proposed extension model

Keep **scan modality** separate from **curriculum profile**:

- A **modality module** describes the case shape and behavior for one scan type, such as Heart, Lung, or DVT. It owns its structured fields, form section, review section, case summary, privacy-text extraction, and pathway-specific export mapping where needed.
- A **curriculum profile** describes versioned requirements for a modality: totals, supervision, quotas, case mix, protocol guidance, source documents, and effective dates. For example, FUSIC Heart v13 is a profile for Heart, not a second Heart case type.
- Shared **logbook modules** own navigation, pathway selection, case lists, filtering, common case fields, local settings, and the common progress/review shell.
- Shared **case review** owns common case metadata and delegates the structured details area to the selected modality module.

Curriculum additions should be ordinary TypeScript modules imported into a registry at build time. This meets the goal of allowing contributors to add curricula by coding, without a runtime curriculum editor, downloaded definitions, or ingestion of training packs. Keep curriculum facts and source citations in data-focused profile files; keep form behavior in modality components.

An eventual layout could look like this (names are illustrative):

```text
src/
  app/                         # routing and app-level coordination
  features/logbook/            # case list, overview, settings, shared case workflow
  features/case-review/        # common review shell
  pathways/
    registry.ts                # statically imported modality modules
    heart/
      case.ts                  # Heart-specific case fields and defaults
      CaseFields.tsx           # Heart form fields
      CaseDetails.tsx          # Heart review fields
      metrics.ts               # Heart-specific metrics contributions
      exports.ts               # Heart-specific CSV/PDF mappings
      curricula/
        fusic-heart-v13.ts     # versioned requirements and sources
    lung/
      ...
  domain/                      # common case types and pure shared rules
  storage/                     # IndexedDB schema, backup, and migrations
```

Do not create empty folders or move files solely to match this sketch. Extract a module when it has a cohesive responsibility and can be tested independently.

## Suggested modularization order

1. **Define the boundaries before moving code (mapped).** This document separates modality modules from curriculum profiles and records the proposed extension points. Keep the existing discriminated case union; it gives TypeScript useful checks.
2. **Extract form sections (in progress, moderate).** `CaseForm` remains the shared shell for date, supervision, demographics, and notes. Abdomen's structured fields are the first extracted component in `src/pathways/abdomen/AbdomenFormFields.tsx`. Follow the same pattern for the other modalities; Heart and Lung already have some form/report separation.
3. **Extract case review and list summaries (moderate).** Keep common metadata and action controls shared; delegate structured details and pathway-specific summary text to each modality.
4. **Move metrics and export mappings behind modality modules (moderate/difficult).** Start with read-only functions. Preserve the current CSV columns, print output, and metric meanings with regression tests.
5. **Separate curriculum profiles from modality behavior (moderate/difficult).** Convert the existing requirements catalogue into typed versioned profiles and have progress calculations consume the selected profile. Before storing profile selection, decide whether switching profile reinterprets all existing cases or whether cases/logbooks retain the profile version they were recorded under.
6. **Make extension contributor-friendly (easy).** Add an end-to-end guide showing how to add a profile and, when required, a new modality, including source checks, backup validation, migrations, privacy checks, sample cases, exports, and tests.

Adding only a new curriculum profile for an existing modality should not require a new case schema. A new modality can still require coordinated updates to the discriminated case type, draft factory, backup validator, IndexedDB data compatibility, metrics, and exports. Keep those integrations explicit rather than hiding them behind a highly dynamic plugin system.

The main improvement is not a wholesale rewrite. Preserve the existing boundaries and extract large modules when a concrete change can be isolated and covered by a regression test.
