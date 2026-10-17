# CritSono: POCUS Logbook Roadmap

## Product direction

Build an open-source, offline-first logbook for personal POCUS training and post-certification practice. The primary product is a mobile-friendly installable PWA. Packaging the same codebase as iOS and Android apps is a future stretch goal, not part of the current plan.

The product stores cases on the device and works offline. There is no CritSono: POCUS Logbook account service or app-operated data backend. Optional user-managed encrypted Google Drive backup is available when a Google OAuth client ID is configured at build time. Provider sync and native app packaging are future stretch goals; any native app builds must include the web assets in the app package and must not rely on downloading the app from a hosted web server at launch.

## Product principles

- **Private by default:** avoid patient-identifiable information; keep records on-device by default and make any cloud connection optional and user-authorized.
- **Useful offline:** recording and reviewing cases should not require a network connection.
- **One source of truth:** keep the data model and interface in the PWA codebase so future native wrappers can reuse them.
- **Pathway-aware, not one-size-fits-all:** totals, supervision minimums, case mix, and other rules differ by modality and curriculum version.
- **Training mode is not certification:** show progress as a personal aid, never as an accreditation decision.
- **Certification does not erase history:** hiding training targets must leave cases and personal statistics intact.
- **Portable data:** users can export readable records and make a restorable backup; future cloud copies are encrypted on-device and stored directly with a provider chosen by the user.
- **No app-operated user accounts:** do not collect email addresses or maintain a user directory for logbook access or sync.

## Roadmap

### Suggested next steps

These are a practical starting order based on the open checklist below, not new commitments:

1. Cover local persistence failure cases and ensure failed saves are never reported as successful.
2. Complete automated coverage for persistence failures and PDF export formats, including combined case reports.
3. Verify printing, safe-area layout, and backup/export behavior in the PWA.

Other open requests remain listed in their relevant sections below. Update this shortlist when priorities change.

### 0. Foundation and decisions

- [x] Create the initial roadmap.
- [x] Establish a TypeScript, React, and Vite app shell.
- [x] Add PWA offline configuration.
- [x] Install dependencies and verify web and production builds when Node.js/npm are available.
- [x] Decide which pathways are in the first usable release: FUSIC Lung and FUSIC Heart.
- [x] Decide whether training/post-certification mode is per pathway or a single app-wide setting: per pathway.
- [x] Review the supplied 2025 Lung v10 and Heart v13 training and assessment packs. Training-pack pages provide the 30/10 Lung and 50/10 Heart logbook references; assessment packs provide compatible report fields, rather than separate competing scan totals.

**Exit criteria:** the PWA scaffold builds; scope and source versions for the first pathways are agreed. Met for the initial web scaffold.

### 1. Curriculum and data model

- [x] Complete a versioned pathway requirements catalogue, including scan-type quotas, case-mix constraints, and collection windows. See [`src/domain/pathway-requirements.ts`](./src/domain/pathway-requirements.ts). The catalogue documents seven pathways; the app currently supports Heart, Lung, Abdomen, DVT, HD, and Vascular. Focused TOE is documented for future consideration and is not planned for the current release.
- [x] Record the source document and version for the initial total and directly supervised references.
- [x] Define a de-identified case record with date, pathway, clinical/healthy-volunteer case type, supervision, optional supervisor, report fields, structured pathway details, and reflection.
- [x] Allow editing and deletion; use a scan date rather than patient-linked or timestamp-derived dates; allow multiple entries on the same date.
- [x] Add optional impression and management-impact review markers.
- [x] Add privacy-aware checks for email addresses, phone numbers, labelled patient/record numbers, and labelled dates of birth in free-text fields. Show a non-blocking warning and confirmation without changing or discarding text; clinical terms are not treated as identifiers. Names and unlabelled identifiers may not be detected.

**Exit criteria:** pathway requirements and source versions are traceable in the catalogue, and free-text privacy checks warn users about common identifier patterns without silently changing their notes. Met for the current heuristic checks; users must still review notes because names and unlabelled identifiers may not be detected.

### 2. Core logbook

- [x] Add and edit a case using pathway-specific forms.
- [x] Browse and search case details, sort by scan date, and filter by pathway and supervision status.
- [x] Show supervised and unsupervised counts alongside total cases.
- [x] Persist records locally in IndexedDB and keep case entry and retrieval available offline.
- [x] Show local storage errors; do not report a case as saved when persistence fails.

**Exit criteria:** a user can record, find, inspect, and edit cases offline, with counts matching the stored records.

- [x] Add storage-level automated coverage for persistence failures; failed writes propagate errors and leave the case unsaved. The app reports success only after persistence and refresh complete.

### 3. Progress, mode, and review

- [x] Add a training view that compares recorded cases with the selected pathway's initial total and supervised references.
- [x] Show case-mix and protocol guidance for supported pathways, and quota details when a supported pathway defines them. DVT tracks its positive scan requirement, HD its normal-scan cap, and Vascular its scan-type and supervised quotas.
- [x] Add an independent post-certification setting for each pathway that hides targets without deleting cases.
- [x] Add a post-certification review summary for abnormal impressions and management changes.
- [x] Prototype descriptive pathway metrics for activity, recorded scan details and findings, image quality, and review markers; development sample data remains in memory only.
- [x] Test boundary conditions: no cases, exactly at target, over target, switching modes, and changing pathways.

**Exit criteria:** progress is calculated from versioned pathway rules; changing mode changes presentation only, not stored case data.

### 4. Export and recovery

- [x] Export a selected pathway as CSV with stable columns, case numbers, pathway-specific findings, and no internal IDs or timestamps; CSV text is escaped and spreadsheet formulas are neutralized.
- [x] Export and restore a complete, versioned JSON backup; restore merges new case IDs, keeps existing cases and preferences on conflicts, validates the entire file, migrates v1 and v2 backups, and is idempotent.
- [x] Encrypt new backup exports on-device with a user-held passphrase; authenticate the encrypted envelope and retain restore support for older plaintext JSON backups. The passphrase is not stored or recoverable by the app.
- [x] Produce a print-ready PDF sheet for an individual case using the browser/device print dialog.
- [x] Produce a pathway-specific printable PDF logbook/report with the supplied training-logbook table layout, blank rows to the pathway reference, and continuation pages for extra cases.
- [x] Download all saved case reports for a pathway as one PDF, with each case on its own A4 page; fit previews to the available screen width and provide A4 print margins.
- [x] Move logbook, CSV, PDF, backup, and restore controls into Settings; use the native share sheet for backup and CSV files where supported, keep browser downloads as the web fallback, and show actionable errors when an export cannot be created or shared.
- [x] Restrict JSON backups to documented logbook fields and reject unknown fields; remind users that free-text notes must remain de-identified.

**Exit criteria:** exported records can be inspected, and encrypted or legacy backups can be restored into a clean installation without data loss. PWA backup/export controls are in Settings; native backup and CSV files use the system share sheet when packaged. Native device behavior still needs release verification.

- [x] Cover CSV and PDF export formats, including combined case reports. CSV, individual case, logbook, and combined case-report formats have automated tests.

### Stretch goals

These are optional follow-ons after reliable local backup and restore:

1. **User-managed provider sync:** preserve local-first and offline behavior; connect directly from the user's device to a provider they choose, with no app-operated account service or data relay. The encrypted portable backup and restore layer is implemented; never send readable case data to a provider through the app.
   - First plan the threat model, provider permissions, OAuth flows, PWA/native credential storage, deletion/disconnection behavior, and privacy disclosures. Do not request email/profile scopes or retain provider account identifiers.
   - Before provider sync, review the passphrase-based key derivation strength and recovery UX on target devices. Explain that losing the passphrase makes the encrypted copy unrecoverable; provide a recovery/passphrase verification flow.
   - Keep `src/domain/backup.ts` responsible for validating and migrating the portable backup schema. Separate transfer orchestration from that domain module and define provider adapters that only receive or return opaque, already-encrypted backup files. Prefer small provider-specific adapters over a runtime plugin loader; contributors can add and build adapters in TypeScript.
   - [x] Add optional Google Drive encrypted backup upload and latest-backup restore in the web app using the narrow `drive.appdata` scope. The static PWA uses Google's browser token model with access tokens held only in memory; this Google-specific exception to the PKCE preference avoids an app backend but requires reauthorization after token expiry or page reload. Google configuration and hidden-folder deletion limitations are documented. Capacitor builds remain disabled until a system-browser OAuth flow is implemented.
   - Evaluate a direct HTTPS endpoint with a documented upload/latest-download contract and Nextcloud-compatible WebDAV as self-hostable options; verify HTTPS, browser CORS, authentication, retention, and deletion behavior on real instances. Nextcloud recommends revocable app passwords for third-party WebDAV clients, but direct PWA use still depends on the server permitting the app origin and WebDAV methods through CORS. Evaluate OneDrive app-specific folders and iCloud's platform-specific file access separately. Keep provider tokens on-device using platform-appropriate secure storage; use OAuth authorization code with PKCE for public clients wherever the provider and platform support a backend-free flow.
   - Add upload confirmation, last-success status, file/version integrity checks, revocation and deletion guidance, and a conflict flow that never silently overwrites cases. Retain readable manual export/import as a recovery path.
   - After one-provider backup/restore is reliable, consider opt-in cross-device sync with explicit conflict resolution and preservation of both copies when they differ.
2. **Privacy-preserving product metrics (optional):** decide whether any metrics are needed before adding telemetry. Default to off; never send logbook content, email, provider identity, or persistent installation identifiers. If enabled, collect only coarse, batched feature/version counts and document that hosting and provider infrastructure may still process connection metadata such as IP addresses.
3. **Backup reminders and history:** show the last successful backup date and let users set a local reminder; never claim a provider copy exists until its upload is confirmed.
4. [x] **Spreadsheet-friendly CSV export:** export a selected pathway with stable column names and no internal or patient-identifying fields.
5. **Printable review reports:** produce a user-selected, de-identified PDF summary.
6. **Richer personal review:** activity over time, scan-type summaries, and verified case-mix views without turning the app into a clinical decision tool.
7. **Additional pathways:** the current PWA supports Heart, Lung, Abdomen, DVT, HD, and Vascular. Abdomen was added using FUSIC v11 (2025) and its matching 2025 v11 Assessment Pack. DVT was added using FUSIC DVT v1 (2026) and its Assessment Pack. HD logging covers the ten clinical questions and revised 2026 core measurements. Focused TOE is a separate future stretch goal below.
8. **Advanced echo findings:** consider recording findings beyond the HD curriculum only if there is a clear personal-review use case. Map any overlap with HD first so curriculum fields are not duplicated.
9. **Focused TOE support:** consider adding the pathway after the current release; verify the then-current source pack and requirements before planning implementation.
10. **Native app packaging:** if pursued, plan and build iOS and Android wrappers around the local web assets; verify storage, upgrades, offline use, backup/restore, printing, and exports on devices. Native projects are not part of the current release plan.

### 5. PWA release readiness

- [x] Add a GitHub Pages build/deploy workflow and document site-origin storage, local backup/restore, and test-data privacy.
- [ ] Verify PWA install, upgrades, offline use, storage, backup/restore, printing, and exports on supported browsers and mobile devices.
- [x] Add automated tests for JSON backup validation, v1 migration, and restore merge behavior.
- [x] Add catalogue integrity tests for source links, route limits, Vascular quotas, the fTOE alternate route, and the FUSIC HD effective date.
- [x] Document build, release, data-backup, and privacy expectations in [`README.md`](./README.md).

**Exit criteria:** the PWA installs, works offline, and preserves user data across supported upgrades. Native packaging, if pursued later, has separate release checks in the stretch goals.

### 6. Open-source and contributor readiness

The initial repository and dependency review is recorded in [`OPEN_SOURCE_REVIEW.md`](./OPEN_SOURCE_REVIEW.md). The codebase uses open-source packages and has domain, storage, provider, hook, and UI boundaries; the following release-readiness improvements remain:

- [x] Add contributor setup and contribution guidance, issue templates, and security reporting instructions.
- [ ] Generate and review third-party dependency notices for distributed builds; document provenance and licenses for non-package assets.
- [ ] Run `npm ci` and `npm run check` on pull requests, and pin GitHub Actions to verified immutable commit SHAs.
- [ ] Add a concise architecture guide for data flow, pathway extensions, and storage migrations.
- [x] Move shared interface colors into `src/theme.css` and reuse semantic palette tokens across pages and pathways.
- [ ] Refactor oversized UI modules only when a concrete behavior change can be isolated and regression-tested.

## User feedback backlog

Feedback received 16 October 2026. These are requests to triage, not commitments or implemented behavior. Reassess them against the existing roadmap, confirm scope where noted, and then turn agreed work into small deliverable milestones.

### Bugs and usability issues

- [x] **P1 · Print/PDF layout:** use a compact, FUSIC-style A4 report layout and automatically scale individual case sheets to the printable page height.
- [ ] **P1 · Installed-PWA printing:** verify the in-app PDF preview, print dialog, direct download, and close-to-logbook flow on an iOS Home Screen install. The app now keeps the preview in-app instead of opening a separate window.
- [x] **P1 · Case review:** add a read-only case detail view from the Cases screen, covering pathway-specific details, findings, supervision, and notes.
- [ ] **P1 · Installed PWA safe-area layout:** prevent the iOS Home Screen “Liquid Glass”/system UI area from overlapping the top of the app. Safe-area support is in place; verify it on an installed iOS Home Screen app.
- [x] **P1 · PDF date format:** use UK date formatting (`01/10/2026`) rather than US month-first formatting.
- [x] **P1 · PDF preview and batch export:** fit case and logbook previews to screen width, retain print margins on A4, and download all saved case reports as a single PDF with one page per case. Disable the case-report export when the pathway has no cases; the blank logbook summary remains printable.
- [x] **P2 · Lung form:** organise entry by finding, with Yes / No choices and a single-line Not assessed checkbox for each region. Keep region-keyed case data and show case review and print/PDF results by region. Existing U/A values remain supported.
- [x] **P2 · Heart assessment input:** replace per-finding dropdowns with one-tap Yes, No, and Not assessed buttons; retain compatibility with existing saved responses.
- [x] **P2 · Overview navigation:** make the case-count card open the Cases page when selected.
- [x] **P2 · Supervisor management:** let users add and manage their own supervisors in Settings, then select a supervisor from a dropdown in the case forms.
- [x] **P2 · Curriculum and modules:** add the FUSIC curriculum selection and Heart/Lung module toggles in Settings. Hide disabled modules from pathway selection while retaining their saved cases; keep at least one module enabled. Add future curriculum and module choices as they are implemented.
- [x] **P2 · Mobile form zoom:** prevent the page from unexpectedly zooming when a text input is focused by keeping mobile text controls at a readable 16px minimum.
- [x] **P2 · Responsive text and controls:** provide a usable way to scale text up or down on mobile, and ensure form inputs and buttons resize and reflow without clipping or breaking the layout.
- [x] **P2 · Unsaved case protection:** warn before closing or cancelling a case with unsaved changes, and let the user return to editing without losing the draft.
- [x] **P2 · Mobile lung assessment controls:** keep the existing finding-first organization, and improve spacing, grouping, or navigation between findings on narrow screens so region responses remain easy to scan and tap. Do not reorganize the form by region.
- [x] **P2 · Mobile case actions:** increase the tap areas and spacing for Review, PDF, Edit, and Delete, and consider placing less-used actions in a menu to make the primary action easier to reach.
- [x] **P2 · Case form optional sections:** reduce the initial form length by making optional sections easier to expand on demand, with clear cues about which details are optional.
- [x] **P2 · Save confirmation:** show a brief success message after a case is saved so users know the action completed.
- [x] **P2 · Mobile pathway context:** keep a concise pathway identifier visible on narrow screens when the pathway description is hidden.
- [x] **P2 · Backup restore wording:** clarify on the restore control that restoring merges backup data with the current logbook.
- [x] **P3 · Empty metrics action:** offer a direct way to add a case when Metrics has no cases to summarize.
- [x] **P3 · Metrics period:** allow users to switch between a rolling 12-month view and a calendar-year view; weekly/daily breakdowns are not requested.
- [x] **P3 · Pathway ordering:** put FUSIC Heart first in the pathway selector and make it the initial pathway.

### Nice-to-have features

- [ ] **Scan image review:** consider viewing images attached to cases only after deciding whether these are clinical images and reviewing the product's explicit exclusion of clinical-image storage, plus local storage, backup, export, and privacy implications. This is optional future work, not part of the current plan.
- [ ] **Assessment-pack documents:** allow users to store certificates and examination scans for their assessment pack. Decide supported file types, on-device storage limits, backup/export behavior, and privacy protections before implementation.
- [ ] **Assessment requirements guidance:** add links and breakdowns of assessment requirements, and keep the guidance aligned with current training packs and their versions.

### Reassessment notes

- Address print/PDF correctness, date formatting, and mobile safe areas as core reliability concerns. Image review remains a nice-to-have pending a privacy and scope decision.
- Continue mobile usability work on mobile use of the finding-first lung assessment form. Keep the lung form grouped by finding; improve its mobile usability without switching to region-first grouping. Focus-zoom prevention, text-size controls, and supervisor management are implemented.
- Verify print/save and safe-area behavior on an iOS Home Screen install.
- Metrics activity now supports rolling 12-month and calendar-year-to-date views.
- Keep certificates, exam scans, and any scan-image feature optional and local-first unless a separately reviewed storage and privacy decision changes that direction.
- The requests for assessment requirements overlap the versioned pathway catalogue and curriculum-source verification work in sections 1 and 3; update those milestones rather than maintaining a second source of truth.

## Verified curriculum catalogue (16 October 2026)

The source versions and structured requirements are recorded in [`src/domain/pathway-requirements.ts`](./src/domain/pathway-requirements.ts). Each linked training pack is published by the Intensive Care Society. These are logbook requirements, not a claim that the app implements or awards accreditation. All seven pathways specify a 12-month scan-collection window.

| Pathway and source | Total / directly supervised | Case mix and scan-type requirements |
| --- | --- | --- |
| [FUSIC Heart, v13 (2025)](https://ics.ac.uk/static/fbd90d07-49c8-4290-b59715a3922911aa/FUSIC-Heart-Training-Pack-v13-2025.pdf) | 50 / 10 | Pathology range; no more than 10% healthy volunteers; attempt all four pathway views. |
| [FUSIC Lung, v10 (2025)](https://ics.ac.uk/static/947f68af-d44d-4c7a-ab16d6697ee897b0/FUSICLung-Training-Pack-2025-V10.pdf) | 30 / 10 | Pathology range; no more than 10% healthy volunteers; image all six examination points (three per side). |
| [FUSIC DVT, v1 (2026)](https://ics.ac.uk/static/beaa5df0-fd47-4e83-9ed28e72533d2eb6/FUSIC-DVT-Training-Pack-v1-2026.pdf) and [Assessment Pack](https://ics.ac.uk/asset/89A15FB1-7BED-4818-865C7600311B3C1A/) | 10 / 5 | At least one DVT-positive scan; three-point technique; no more than 10% healthy volunteers. |
| [FUSIC Abdomen, v11 (2025)](https://ics.ac.uk/static/ef0ddaff-73a2-484d-95acc7a5ab3be630/FUSICAbdomen-Training-Packv11-2025.pdf) and [Assessment Pack v11 (2025)](https://ics.ac.uk/static/4f58cbc7-b6d1-4ed4-9dcb9d4990a126ec/FUSIC-Abdomen-Assessment-Pack-2025-v11.pdf) | 25 / 10 | Pathology range; no more than 10% healthy volunteers; attempt required pathway views. |
| [FUSIC Vascular, v1 (2026)](https://ics.ac.uk/static/57fbde91-95b6-44c9-89fbe7ba577cd952/FUSICVascular-Training-Pack-v1-2026.pdf) and [Assessment Pack (2026)](https://ics.ac.uk/asset/9E05D301-0951-4BF8-A1E535C7A3933107/) | 30 / 5 | At least one vascular-access case; CVC 5 (3 supervised), PICC/midline 3 (1 supervised), peripheral access 2 (1 supervised); peripheral access may substitute for unavailable PICC/midline cases; no more than 10% healthy volunteers. |
| [FUSIC HD, v11 (2026)](https://ics.ac.uk/static/792a27d9-c0d5-479d-95ebaf79f77269f4/FUSIC-HD-Training-Pack-2026-v11.pdf), [Assessment Pack](https://ics.ac.uk/asset/E1ADF59F-6927-4AD3-B765C4B10F133C35/), and [Complete Guide](https://ics.ac.uk/asset/08F17125-7601-49EB-B00D9F2201376D45/) | 50 / 20 | Broad pathology; no more than 10 normal scans and no more than 10% healthy volunteers. Dataset changes for scans from 1 February 2026 are recorded separately in the catalogue. |
| [Focused TOE, v11 (2025)](https://ics.ac.uk/static/286c0975-e7d1-4f98-a1eaf18489dc1d6d/Focused-TOE-Certification-Training-Packv11-2025.pdf) | 50 / first 20; an eligible prior-accreditation route allows 30 / first 20 | Eight-view minimum dataset; no more than 50% normal studies; 12-month logbook window and 24-month accreditation window. |

Heart, Lung, DVT, Abdomen, Vascular, and HD also limit healthy-volunteer studies to 10% of the logbook. FUSIC HD has a separate fixed cap of 10 normal scans. The percentages and fixed caps are intentionally represented separately. Confirm the source pack again before changing a requirement; assessment packs are not treated as competing scan-count sources.

## Initial technical choices

- **UI and build:** React, TypeScript, Vite.
- **PWA:** Vite PWA plugin with a generated service worker and web app manifest.
- **Future native packaging stretch goal:** Capacitor can use the local `dist` output (`webDir`) and must not configure a remote web server if native packaging is pursued.
- **Persistence:** IndexedDB stores cases and settings on-device; persistence-failure coverage remains open in section 2.
- **Backend:** no app-operated account service, data relay, or logbook storage backend is planned. The PWA and optional native clients connect directly to user-authorized storage providers for future sync.

## Out of scope for the initial release

- An app-operated user account service, hosted logbook storage, or data relay.
- Continuous cloud sync; any future sync must be optional, user-managed, and encrypted on-device before upload.
- Clinical decision support or use of training records as a clinical record.
- Automatic claims of FUSIC/TOE eligibility, competence, or accreditation.
- Capturing patient identifiers or storing clinical images.
