# Contributing

Thanks for considering a contribution to POCUS Logbook. Small, focused changes are easiest to review.

## Set up the project

- Install Node.js 20 or newer and npm.
- Clone the repository and run `npm ci` from its root.
- Run `npm run dev` to start the local app.
- Run `npm run check` before opening a pull request. It runs the test suite, TypeScript check, and production PWA build.

## Make a change

- Check [ROADMAP.md](./ROADMAP.md) for current product scope. Native app packaging and Focused TOE are future work; avoid treating them as current release requirements.
- Keep case rules and pathway requirements in `src/domain/`. Cite the source pack and version when changing a curriculum requirement.
- If saved case or settings data changes, update the IndexedDB migration and backup validation as needed, and add tests for old saved data and backups.
- Keep provider transport in `src/cloud/`, browser persistence in `src/storage/`, and interface code in `src/components/` and `src/hooks/`.
- Add or update tests for changed behavior. For interface changes, include a screenshot or a concise description of the screen and viewport you checked.
- Avoid unrelated refactoring in a feature or bug-fix pull request.

## Protect privacy

- Never use real patient information in issues, pull requests, screenshots, test fixtures, or sample data. Do not attach logbook backups or exports.
- Use synthetic examples only. Check free-text examples and generated files for identifying details before sharing them.
- Do not commit official training or assessment pack PDFs. See the rights note in [README.md](./README.md).
- Report security vulnerabilities privately as described in [SECURITY.md](./SECURITY.md), not in a public issue.

## Open a pull request

Describe the user-facing change, note any data-model or migration impact, and list the checks you ran. Link related issues when applicable. The project is licensed under Apache-2.0; see [LICENSE](./LICENSE).
