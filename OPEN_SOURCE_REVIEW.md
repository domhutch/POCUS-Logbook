# Open-source and modularity review

Review date: 17 October 2026

This is a practical repository review, not legal advice or a complete compliance audit. Dependency counts below are based on the checked-in `package-lock.json` license metadata. Recheck package contents, asset provenance, and redistribution terms before publishing a release.

## Current assessment

**Open-source readiness: good at the source-code level, with release-distribution work still open.** The project declares Apache-2.0 and includes the license text. The direct runtime stack is made of established open-source packages (React, Capacitor, html2canvas, jsPDF, and idb). The lockfile contains 522 third-party package entries with declared license metadata. `public/THIRD_PARTY_NOTICES.txt` now carries the license and notice files for the 32 installed production dependencies; compound or alternative expressions are flagged for release review. The lockfile inventory also includes development and platform-specific packages that do not ship with the PWA. Neither source establishes rights for non-package assets.

**Modifiability: good for contributors comfortable with TypeScript and React; not a runtime plugin system.** The six supported scan pathways have separate form, review, case-summary, metric, CSV, and print modules. Curriculum requirements are data-only typed profiles in `src/curricula/fusic/`, registered statically. A contributor can add a curriculum profile without inventing another case type. A new scan modality still crosses shared case types, draft defaults, backup validation, persistence compatibility, dispatchers, and tests; the contributor guide documents those touchpoints.

This is a maintainable small application, not a configurable platform. FUSIC is the only active curriculum, and adding curriculum profiles requires editing TypeScript and rebuilding. There is no public plugin API, dynamic module loading, or runtime curriculum editor. That is consistent with the stated goal of allowing code contributions while keeping imported curriculum content out of the app.

The main contributor friction is concentrated in shared files: `src/App.tsx` is 526 lines after extracting case, settings, and sample-data workflows into hooks; `src/domain/backup.ts` is 617 lines; `src/domain/logbook.ts` is 413 lines; and `src/styles.css` is 3,157 lines. The remaining app file primarily coordinates pages and shared layout. These sizes are reasons to extract a cohesive workflow when it is next changed, not to split files mechanically. Automated coverage spans domain, backup, storage, and export behavior; UI-level coverage and real-device PWA checks remain limited.

## Gaps and suggested improvements

| Priority | Finding | Suggested improvement | Difficulty |
| --- | --- | --- | --- |
| Before distributing builds | A reproducible notice file now includes the installed production dependency licenses. Asset provenance is documented in `ASSET_CREDITS.md`, but attribution to FUSIC® and the Intensive Care Society (ICS) is now recorded for the Heart and Lung report-form SVGs, while redistribution terms remain unconfirmed. The portrait illustration source and rights also remain unresolved. | Confirm project asset ownership; review redistribution terms for the attributed FUSIC®/ICS form templates and obtain rights or replace them before distribution. Confirm the portrait illustration source and rights, or replace it. Regenerate and review dependency notices after dependency changes. | Moderate; external confirmation may be needed |
| Before accepting pull requests | Pull requests targeting `main` now run `npm ci` and `npm run check` in `.github/workflows/pull-request-check.yml`. The Pages workflow and PR check pin each GitHub Action to an immutable commit SHA, with the verified release version in a comment. | Keep action pins current through deliberate updates and verify the SHA against the action's official release before changing it. | Complete; ongoing maintenance |
| Modularity | Pathway UI and reporting behavior is separated, but a new modality still requires coordinated edits to shared domain types/defaults, backup validation, persistence compatibility, and dispatch points. `App.tsx` is down to 526 lines after moving case lifecycle, settings persistence, and sample-data management into focused hooks; `backup.ts` remains large. | Keep the discriminated case model and explicit backup schema. Extract remaining shared dispatch/validation or UI composition only alongside concrete changes that give each module a clear owner. | Ongoing |
| UI confidence | Automated tests cover domain rules, persistence, backups, and selected exports. Important browser behaviors such as install/upgrade, offline use, save feedback, print preview, and actual file delivery still rely on manual verification. | Keep a short browser/device release checklist; add UI automation only for a repeatable release-critical flow or a concrete regression. | Moderate |
| Contributor onboarding | Setup, privacy, migrations, and pathway/profile extension steps are documented in `CONTRIBUTING.md`, but there is no architecture/data-flow guide or runnable example contribution. | Add a short architecture guide when the data flow or extension steps change enough that the contributor guide no longer makes the system easy to navigate. | Easy |

## Important licensing boundary

CritSono’s normal case and logbook print layouts are project-authored and covered by Apache-2.0. The separate Heart and Lung ICS form exports use FUSIC®/Intensive Care Society report-form templates; their source forms and branding are attributed in `ASSET_CREDITS.md` and remain under their own rights. `Source Material/` and `curriculum/` are ignored by Git, but ignore rules do not prevent other copied or derived assets from being committed. The portrait illustration still lacks a recorded source and license. The package-license inventory does not establish rights for curriculum content or any non-package asset.

## Modularity boundaries

- `src/domain/`: case types, pathway rules, validation, metrics, and export document generation. Keep this independent of React and IndexedDB.
- `src/storage/`: IndexedDB schema, migrations, and persistence. Keep schema changes paired with migration tests.
- `src/cloud/`: provider-specific encrypted backup transport. Keep OAuth/provider behavior out of the domain model.
- `src/hooks/`: app workflows that coordinate domain operations and UI state.
- `src/components/`: screens and form controls.

All six pathways now own their structured form fields, review details, case-card summaries, metric breakdowns, CSV columns and values, and individual PDF detail layouts under `src/pathways/`. Shared components and domain export builders retain common fields, formatting, and output assembly, then dispatch to pathway modules. Versioned curriculum profile data is now separated into `src/curricula/fusic/` with a static registry. FUSIC is still the only active curriculum, and no per-user or per-case profile selection is stored. Backup validation is contained in `src/domain/backup.ts`, and synthetic sample-case generation is contained in `src/domain/admin-sample-data.ts`; both already have clear module boundaries. Case lifecycle, settings persistence, and sample-data management for the app now live in dedicated hooks. `App.tsx` coordinates pages and shared layout, and the app uses static TypeScript extension points rather than user-installable modules. Extract further only when a UI boundary or workflow needs independent ownership or focused tests.

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
    lung/
      ...
  curricula/                   # curriculum profiles and static registries
    fusic/
      registry.ts
      heart.ts                  # versioned requirements and sources
      ...
  domain/                      # common case types and pure shared rules
  storage/                     # IndexedDB schema, backup, and migrations
```

Do not create empty folders or move files solely to match this sketch. Extract a module when it has a cohesive responsibility and can be tested independently.

## Suggested modularization order

1. **Define the boundaries before moving code (mapped).** This document separates modality modules from curriculum profiles and records the proposed extension points. Keep the existing discriminated case union; it gives TypeScript useful checks.
2. **Extract form sections (complete, moderate).** `CaseForm` remains the shared shell for date, supervision, demographics, and notes. All six current pathways have structured fields in pathway-owned `...FormFields.tsx` components under `src/pathways/`. Each receives a pathway-specific draft and reports changes through the shared `CaseDraft` callback. The case data shape remains unchanged.
3. **Extract case review and list summaries (complete, moderate).** Common metadata and actions remain in `CaseReview` and `CaseList`; pathway-owned review details are in `...ReviewDetails.tsx`, and pathway-owned case-card summaries are in each module's `caseSummary.ts`. Shared UI dispatches through explicit discriminated-union cases.
4. **Move metrics and export mappings behind modality modules (complete, moderate/difficult).** Read-only metric breakdowns, pathway case-mix counts, CSV columns/values, and individual PDF detail layouts now live under `src/pathways/`. Shared domain code retains common aggregation, CSV escaping/assembly, print styling, and document assembly. Regression tests confirm existing output and metric meanings.
5. **Separate curriculum profiles from modality behavior (complete, moderate/difficult).** Requirements now live in typed, versioned files under `src/curricula/fusic/`; a static registry identifies the default active FUSIC profile for each supported pathway, and progress calculations read through that registry. fTOE remains catalogued separately as a future profile and is not an active pathway. Before adding profile selection or recording profile IDs, decide whether changing a profile reinterprets all existing cases or whether cases/logbooks retain the profile version used when they were recorded.
6. **Make extension contributor-friendly (complete, easy).** `CONTRIBUTING.md` now gives an end-to-end checklist for adding a curriculum profile or pathway, including source checks, backup validation, migrations, privacy, sample cases, exports, and tests.

Adding only a new curriculum profile for an existing modality should not require a new case schema. A new modality can still require coordinated updates to the discriminated case type, draft factory, backup validator, IndexedDB data compatibility, metrics, and exports. Keep those integrations explicit rather than hiding them behind a highly dynamic plugin system.

The main improvement is not a wholesale rewrite. Preserve the existing boundaries and extract large modules when a concrete change can be isolated and covered by a regression test.
