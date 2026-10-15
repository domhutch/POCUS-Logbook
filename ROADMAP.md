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
- [ ] Install dependencies and verify web and production builds when Node.js/npm are available.
- [ ] Decide which pathways are in the first usable release.
- [ ] Decide whether training/post-certification mode is per pathway or a single app-wide setting.
- [ ] Review the current official training packs and resolve any differences between training and assessment documents before encoding rules.

**Exit criteria:** the scaffold builds; its production output can be packaged locally; scope and source versions for the first pathways are agreed.

### 1. Curriculum and data model

- [ ] Define a versioned pathway requirements catalogue, including total cases, directly supervised minimums, scan-type quotas, case-mix constraints, and any collection window that is in scope.
- [ ] Record the source document and version for each configured rule.
- [ ] Define a de-identified case record: date, pathway, scan/study type, supervision status, optional supervisor, required pathway-specific fields, and optional reflection.
- [ ] Decide how edits, deletion, duplicate dates, time zones, and app upgrades affect records.
- [ ] Set a clear warning and validation policy for fields that could identify a patient.

**Exit criteria:** rules and fields are traceable to documents; records can be validated without storing patient identifiers.

### 2. Core logbook

- [ ] Add and edit a case using pathway-specific forms.
- [ ] Browse, search, sort, and filter logs by date, pathway, scan type, and supervision status.
- [ ] Show supervised and unsupervised counts alongside total cases.
- [ ] Persist records locally and keep case entry and retrieval working offline.
- [ ] Handle local storage errors visibly; do not silently report a case as saved when persistence fails.

**Exit criteria:** a user can record, find, inspect, and edit cases offline, with counts matching the stored records.

### 3. Progress, mode, and review

- [ ] Add a training view that compares recorded cases with the selected pathway's configured requirements.
- [ ] Show total and supervised progress separately, plus pathway-specific quotas and case-mix summaries where applicable.
- [ ] Add a post-certification setting that hides logbook target/progress figures without deleting cases.
- [ ] Add a review dashboard with useful activity and case-mix statistics.
- [ ] Test boundary conditions: no cases, exactly at target, over target, switching modes, and changing pathways.

**Exit criteria:** progress is calculated from versioned pathway rules; changing mode changes presentation only, not stored case data.

### 4. Export and recovery

- [ ] Export a logbook as CSV for spreadsheets.
- [ ] Export and restore a complete JSON backup.
- [ ] Produce a printable PDF logbook/report.
- [ ] Use native share/save flows where supported and provide clear errors when an export cannot be created.
- [ ] Ensure exports do not include patient-identifiable data or hidden internal fields.

**Exit criteria:** exported records can be inspected, and a backup can be restored into a clean installation without data loss.

### 5. Mobile packaging and release readiness

- [ ] Generate and check in the iOS and Android Capacitor platform projects when platform tooling is available.
- [ ] Verify the native app loads from assets packaged inside the app, with no hosted-app URL configured.
- [ ] Test install, upgrades, offline use, storage, backup/restore, and exports on iOS and Android.
- [ ] Add automated tests for calculations, pathway rules, persistence, and export formats.
- [ ] Document build, release, data-backup, and privacy expectations.

**Exit criteria:** installed native builds work in airplane mode and preserve user data across supported upgrades.

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
