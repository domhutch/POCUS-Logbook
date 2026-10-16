# POCUS Logbook Roadmap

## Product direction

Build an open-source, offline-first logbook for personal POCUS training and post-certification practice. The app will use one mobile-friendly web codebase that can run as an installable PWA and be packaged as iOS and Android apps with Capacitor.

The native apps must include the built web assets in the app package. They must not rely on a hosted web app being downloaded at launch. The first release will store data on the device; cloud accounts and synchronisation are out of scope.

## Product principles

- **Private by default:** avoid patient-identifiable information; keep records on-device in the initial release.
- **Useful offline:** recording and reviewing cases should not require a network connection.
- **One source of truth:** use a shared data model and interface across PWA, iOS, and Android.
- **Pathway-aware, not one-size-fits-all:** totals, supervision minimums, case mix, and other rules differ by modality and curriculum version.
- **Training mode is not certification:** show progress as a personal aid, never as an accreditation decision.
- **Certification does not erase history:** hiding training targets must leave cases and personal statistics intact.
- **Portable data:** users can export readable records and make a restorable backup.

## Roadmap

### 0. Foundation and decisions

- [x] Create the initial roadmap.
- [x] Establish a TypeScript, React, and Vite app shell.
- [x] Add PWA offline configuration and a Capacitor configuration that targets bundled build output.
- [x] Install dependencies and verify web and production builds when Node.js/npm are available.
- [x] Decide which pathways are in the first usable release: FUSIC Lung and FUSIC Heart.
- [x] Decide whether training/post-certification mode is per pathway or a single app-wide setting: per pathway.
- [x] Review the supplied 2025 Lung v10 and Heart v13 training and assessment packs. Training-pack pages provide the 30/10 Lung and 50/10 Heart logbook references; assessment packs provide compatible report fields, rather than separate competing scan totals.

**Exit criteria:** the scaffold builds; its production output can be packaged locally; scope and source versions for the first pathways are agreed. Met for the initial web scaffold.

### 1. Curriculum and data model

- [ ] Complete a versioned pathway requirements catalogue, including scan-type quotas, case-mix constraints, and collection windows. The initial total/direct-supervision references are shown in the app, with their source versions.
- [x] Record the source document and version for the initial total and directly supervised references.
- [x] Define a de-identified case record with date, pathway, clinical/healthy-volunteer case type, supervision, optional supervisor, report fields, structured pathway details, and reflection.
- [x] Allow editing and deletion; use a scan date rather than patient-linked or timestamp-derived dates; allow multiple entries on the same date.
- [x] Add optional impression and management-impact review markers.
- [ ] Validate potentially identifying text beyond the in-form privacy warning.

**Exit criteria:** remaining rules and fields are traceable to documents; records can be validated without storing patient identifiers.

### 2. Core logbook

- [x] Add and edit a case using pathway-specific forms.
- [x] Browse and search case details, sort by scan date, and filter by pathway and supervision status.
- [x] Show supervised and unsupervised counts alongside total cases.
- [x] Persist records locally in IndexedDB and keep case entry and retrieval available offline.
- [x] Show local storage errors; do not report a case as saved when persistence fails.

**Exit criteria:** a user can record, find, inspect, and edit cases offline, with counts matching the stored records.

### 3. Progress, mode, and review

- [x] Add a training view that compares recorded cases with the selected pathway's initial total and supervised references.
- [ ] Show pathway-specific quotas and case-mix summaries when the full catalogue has been verified.
- [x] Add an independent post-certification setting for each pathway that hides targets without deleting cases.
- [x] Add a post-certification review summary for abnormal impressions and management changes.
- [x] Prototype descriptive pathway metrics for activity, recorded scan details and findings, image quality, and review markers; development sample data remains in memory only.
- [ ] Test boundary conditions: no cases, exactly at target, over target, switching modes, and changing pathways.

**Exit criteria:** progress is calculated from versioned pathway rules; changing mode changes presentation only, not stored case data.

### 4. Export and recovery

- [ ] Export a logbook as CSV for spreadsheets.
- [x] Export and restore a complete, versioned JSON backup; restore merges new case IDs, keeps existing cases and preferences on conflicts, validates the entire file, migrates v1 and v2 backups, and is idempotent.
- [x] Produce a print-ready PDF sheet for an individual case using the browser/device print dialog.
- [ ] Produce a printable PDF logbook/report.
- [ ] Use native share/save flows where supported and provide clear errors when an export cannot be created.
- [x] Restrict JSON backups to documented logbook fields and reject unknown fields; remind users that free-text notes must remain de-identified.

**Exit criteria:** exported records can be inspected, and a backup can be restored into a clean installation without data loss. JSON backup/restore is implemented for the web app; native save/share flows remain to be verified.

### Stretch goals

These are optional follow-ons after reliable local backup and restore:

1. **Encrypted home-server backups:** client-side encryption before transfer, authenticated access, explicit server configuration, and a tested key recovery/export process. Do not send readable case data to a server.
2. **Backup reminders and history:** show the last successful backup date and let users set a local reminder; never claim a server copy exists until its upload is confirmed.
3. **Spreadsheet-friendly CSV export:** export a selected pathway with stable column names and no internal or patient-identifying fields.
4. **Printable review reports:** produce a user-selected, de-identified PDF summary.
5. **Richer personal review:** activity over time, scan-type summaries, and verified case-mix views without turning the app into a clinical decision tool.
6. **Additional pathways:** add DVT, Abdomen, Vascular, HD, and Focused TOE after their requirements and versioned sources are reviewed.

### 5. Mobile packaging and release readiness

- [x] Add a GitHub Pages build/deploy workflow and document site-origin storage, local backup/restore, and test-data privacy.
- [ ] Generate and check in the iOS and Android Capacitor platform projects when platform tooling is available.
- [ ] Verify the native app loads from assets packaged inside the app, with no hosted-app URL configured.
- [ ] Test install, upgrades, offline use, storage, backup/restore, and exports on iOS and Android.
- [x] Add automated tests for JSON backup validation, v1 migration, and restore merge behavior.
- [ ] Add automated tests for progress calculations, pathway rules, persistence failures, and CSV/PDF export formats.
- [ ] Document build, release, data-backup, and privacy expectations.

**Exit criteria:** installed native builds work in airplane mode and preserve user data across supported upgrades.

## User feedback backlog

Feedback received 16 October 2026. These are requests to triage, not commitments or implemented behavior. Reassess them against the existing roadmap, confirm scope where noted, and then turn agreed work into small deliverable milestones.

### Bugs and usability issues

- [ ] **P1 · Print/PDF layout:** make an individual case printout fit on one page and verify printing or saving as PDF works when the PWA is installed to the Home Screen.
- [x] **P1 · Case review:** add a read-only case detail view from the Cases screen, covering pathway-specific details, findings, supervision, and notes.
- [ ] **P1 · Scan review:** provide a way to view scans/images that have been added to cases.
- [ ] **P1 · Installed PWA safe-area layout:** prevent the iOS Home Screen “Liquid Glass”/system UI area from overlapping the top of the app. Safe-area support is in place; verify it on an installed iOS Home Screen app.
- [x] **P1 · PDF date format:** use UK date formatting (`01/10/2026`) rather than US month-first formatting.
- [ ] **P2 · Lung form:** group location choices under each pathology, with a selectable location for each pathology; make the location label/text clickable as well as its checkbox. Do not present every location as an undifferentiated set of checkboxes for each lung field.
- [x] **P2 · Overview navigation:** make the case-count card open the Cases page when selected.
- [ ] **P2 · Supervisor management:** let users add and manage their own supervisors, then select a supervisor from a dropdown in the case forms.
- [x] **P2 · Mobile form zoom:** prevent the page from unexpectedly zooming when a text input is focused by keeping mobile text controls at a readable 16px minimum.
- [ ] **P2 · Responsive text and controls:** provide a usable way to scale text up or down on mobile, and ensure form inputs and buttons resize and reflow without clipping or breaking the layout.
- [ ] **P3 · Metrics period:** allow users to switch between a rolling 12-month view and a calendar-year view; weekly/daily breakdowns are not requested.
- [x] **P3 · Pathway ordering:** put FUSIC Heart first in the pathway selector and make it the initial pathway.

### Nice-to-have features

- [ ] **Assessment-pack documents:** allow users to store certificates and examination scans for their assessment pack. Decide supported file types, on-device storage limits, backup/export behavior, and privacy protections before implementation.
- [ ] **Assessment requirements guidance:** add links and breakdowns of assessment requirements, and keep the guidance aligned with current training packs and their versions.

### Reassessment notes

- Address print/PDF correctness, date formatting, mobile safe areas, and access to saved scan images as core reliability and data-review concerns.
- Review responsive typography, form interactions, lung pathology/location entry, supervisor selection, overview navigation, and pathway ordering together as mobile case-entry and navigation improvements.
- Reconcile the requested metrics periods with the current metrics behavior and tests before changing the range controls.
- Keep certificates and exam scans optional and local-first unless a separately reviewed storage and privacy decision changes that direction.
- The requests for assessment requirements overlap the versioned pathway catalogue and curriculum-source verification work in sections 1 and 3; update those milestones rather than maintaining a second source of truth.

## Curriculum starting points

The supplied documents indicate materially different requirements. These are initial research notes, not yet executable app rules:

| Pathway | Initial requirement observed | Source to verify before implementation |
| --- | --- | --- |
| FUSIC DVT | 10 scans; at least 5 directly supervised | [FUSIC-DVT-Training-Pack-v1-2026.pdf](./curriculum/FUSIC-DVT-Training-Pack-v1-2026.pdf) |
| FUSIC Lung | 30 scans; at least 10 directly supervised | [FUSIC-Lung-Training-Pack-v10-2025.pdf](./curriculum/FUSIC-Lung-Training-Pack-v10-2025.pdf) |
| FUSIC Heart | 50 scans; at least 10 directly supervised | [FUSIC-Heart-Training-Pack-2025-V13.pdf](./curriculum/FUSIC-Heart-Training-Pack-2025-V13.pdf) |
| FUSIC Abdomen | 25 scans; at least 10 directly supervised | [FUSICAbdomen-Training-Pack-v11-2025.pdf](./curriculum/FUSICAbdomen-Training-Pack-v11-2025.pdf) |
| FUSIC Vascular | 30 scans; at least 5 directly supervised, with scan-type requirements | [FUSICVascular-Training-Pack-v1-2026.pdf](./curriculum/FUSICVascular-Training-Pack-v1-2026.pdf) |
| FUSIC HD | 50 scans; at least 20 supervised; case-mix requirements | [FUSIC-HD-Training-Pack-2026-v11.pdf](./curriculum/FUSIC-HD-Training-Pack-2026-v11.pdf) |
| Focused TOE | 50 examinations and 20 directly observed; 30-exam route for specified prior accreditations | [Focused-TOE-Certification-Training-Packv11-2025.pdf](./curriculum/Focused-TOE-Certification-Training-Packv11-2025.pdf) |

The folder also contains assessment packs and older DVT/vascular documents. Where documents differ, confirm the current official requirement and record the chosen source/version rather than combining the rules implicitly.

## Initial technical choices

- **UI and build:** React, TypeScript, Vite.
- **PWA:** Vite PWA plugin with a generated service worker and web app manifest.
- **Native packaging:** Capacitor; native builds use the local `dist` output (`webDir`) and do not configure a remote web server.
- **Persistence:** on-device storage is the initial direction; select and test the concrete storage implementation during the data-model phase.
- **Backend:** none in the first release.

## Out of scope for the initial release

- User accounts, hosted storage, and cross-device synchronisation.
- Clinical decision support or use of training records as a clinical record.
- Automatic claims of FUSIC/TOE eligibility, competence, or accreditation.
- Capturing patient identifiers or storing clinical images.
