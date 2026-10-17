# Contributing

Thanks for considering a contribution to CritSono: POCUS Logbook. Small, focused changes are easiest to review.

## Set up the project

- Install Node.js 20 or newer and npm.
- Clone the repository and run `npm ci` from its root.
- Run `npm run dev` to start the local app.
- Run `npm run check` before opening a pull request. It runs the test suite, TypeScript check, and production PWA build.

## Make a change

- Check [ROADMAP.md](./ROADMAP.md) for current product scope. Native app packaging and Focused TOE are future work; avoid treating them as current release requirements.
- Keep shared case rules in `src/domain/`. Add curriculum requirement data as a typed, versioned profile under `src/curricula/<curriculum>/`, then register it in that curriculum’s static registry. Cite the source pack and version, and preserve existing profile versions when requirements change. Do not add runtime ingestion or store profile selection with cases without first resolving how selection affects existing records.
- If saved case or settings data changes, update the IndexedDB migration and backup validation as needed, and add tests for old saved data and backups.
- Keep provider transport in `src/cloud/`, browser persistence in `src/storage/`, and interface code in `src/components/` and `src/hooks/`.
- Add or update tests for changed behavior. For interface changes, include a screenshot or a concise description of the screen and viewport you checked.
- Avoid unrelated refactoring in a feature or bug-fix pull request.

## Add a curriculum profile or pathway

### Add a curriculum profile for an existing pathway

1. Read the current official training and assessment sources, and record their title, version, and public URL. Keep source PDFs out of the repository unless redistribution is explicitly allowed.
2. Add a data-only `CurriculumProfile` in `src/curricula/<curriculum>/`. Give it a stable ID, curriculum ID, pathway key, and source version. Keep an existing version unchanged; create a new profile version when requirements change.
3. Register it in the curriculum's static registry. Only add it to `activeProfiles` when the app should use it as a supported default; future or not-yet-supported pathways belong in `futureProfiles`.
4. Check any progress calculations and UI that display the requirements. Do not add profile selection to settings or saved cases until the project has decided how existing cases should be interpreted after a profile change.
5. Add or update profile tests for key requirements, sources, and active/future status.

### Add a new scan pathway

A new pathway affects more than its form. Follow one existing pathway module as the example and check each integration point:

- Add the case fields and draft defaults in `src/domain/logbook.ts`, then add structured form, review, summary, metric, CSV, and print modules under `src/pathways/<pathway>/`.
- Update the pathway registry and shared pathway dispatchers. Keep common fields and layout in their shared components.
- Update `src/domain/backup.ts` for exact field validation and supported historical backup versions. If persisted IndexedDB data changes, add a migration in `src/storage/`.
- Update synthetic admin sample cases in `src/domain/admin-sample-data.ts` and confirm they contain no real patient information.
- Add focused tests for validation, metrics, exports, migrations, and backup compatibility affected by the change.
- Review the UI at a useful viewport and run `npm run check` before opening a pull request.

Keep extension points explicit and statically imported. Do not add runtime code loading or curriculum ingestion as part of a pathway contribution.

## Protect privacy

- Never use real patient information in issues, pull requests, screenshots, test fixtures, or sample data. Do not attach logbook backups or exports.
- Use synthetic examples only. Check free-text examples and generated files for identifying details before sharing them.
- Do not commit official training or assessment pack PDFs. See the rights note in [README.md](./README.md).
- Report security vulnerabilities privately as described in [SECURITY.md](./SECURITY.md), not in a public issue.

## Open a pull request

Describe the user-facing change, note any data-model or migration impact, and list the checks you ran. Link related issues when applicable. The project is licensed under Apache-2.0; see [LICENSE](./LICENSE).
