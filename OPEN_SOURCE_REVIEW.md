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
| Before first public release | No `CONTRIBUTING.md`, security reporting instructions, or issue templates are present. | Add a short contributor guide with setup, checks, data-model/migration guidance, and a clear way to report bugs or security issues. Add issue forms for bugs and feature requests. A code of conduct is optional but useful if accepting community contributions. | Easy |
| Before distributing builds | The lockfile records license metadata, but there is no generated third-party license/notice report for shipped bundles. Asset provenance is also not documented alongside each asset. | Generate and review a dependency license inventory; identify which notices must accompany web/native distributions. Record the source and license for icons and images in an asset credits file. | Moderate |
| Before accepting pull requests | A pull-request workflow now runs `npm ci` and `npm run check`. GitHub Actions are still referenced by version tags rather than immutable commit SHAs. | Pin each action to a verified full commit SHA and keep a readable version comment beside it. | Easy |
| Maintainability | `src/App.tsx` still coordinates several app-level workflows, `src/domain/backup.ts` owns the portable backup schema and validation, and `src/styles.css` remains a large global stylesheet. Backup transfer orchestration has been separated into `src/services/logbook-backup.ts`, with encrypted-file providers defined in `src/cloud/backup-provider.ts`. | Treat large-file refactoring as an ongoing practice, not a line-count target. When a real feature change exposes a cohesive responsibility, extract that responsibility into a named module, preserve behavior, and cover the seam with focused checks. Possible seams include app-level workflows in `App.tsx` and feature or component styles in `styles.css`; split `backup.ts` only if a distinct schema or validation responsibility emerges. | Moderate to difficult |
| Test confidence | Most tests are domain/storage tests; browser-dependent flows such as case-save feedback, print preview, and export delivery do not have UI-level regression coverage. | Add a lightweight component test setup only when a specific UI regression needs it; prioritize save failure feedback and print/export actions. Avoid adding a large test stack without a use case. | Moderate |
| Contributor readability | The README has useful setup and product documentation, but the app's data flow and extension points are not summarized in one short architecture guide. | Add a small architecture note showing UI → hooks → domain/storage/cloud boundaries, plus how a pathway is added and how persisted data is migrated. | Easy |

## Important licensing boundary

The app links to and summarizes selected ICS curriculum requirements, while official training and assessment documents remain under their own rights and are excluded from the repository. Continue to keep official PDFs and supplied source packs out of commits and generated public bundles unless redistribution rights are confirmed. The package-license inventory does not resolve rights for curriculum content, fonts, images, or other non-package assets.

## Modularity boundaries

- `src/domain/`: case types, pathway rules, validation, metrics, and export document generation. Keep this independent of React and IndexedDB.
- `src/storage/`: IndexedDB schema, migrations, and persistence. Keep schema changes paired with migration tests.
- `src/cloud/`: provider-specific encrypted backup transport. Keep OAuth/provider behavior out of the domain model.
- `src/hooks/`: app workflows that coordinate domain operations and UI state.
- `src/components/`: screens and form controls.

The main improvement is not a wholesale rewrite or a target line count. Preserve these boundaries and extract a large module only when a real feature change reveals a cohesive responsibility that can be named, understood, and checked independently. The backup transfer split is one example; `App.tsx` and `styles.css` remain candidates as future changes expose clear seams.
