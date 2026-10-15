# POCUS Logbook

Offline-first POCUS logbook scaffold for the web, with a path to bundled iOS and Android apps.

See [ROADMAP.md](./ROADMAP.md) for the planned product scope, curriculum research, and milestones.

## Requirements

- Node.js 20 or newer
- npm

## Run the web app

```sh
npm install
npm run dev
```

## Build and check

```sh
npm run typecheck
npm run build
npm run preview
```

The production web app is written to `dist/`. The PWA service worker caches the built app shell for offline use.

## Capacitor

The Capacitor configuration points to the local `dist/` directory. Build the web app before syncing native projects:

```sh
npm run build
npm run cap:sync
```

To create a native platform project for the first time:

```sh
npm run cap:add:ios
npm run cap:add:android
```

Native projects embed the built web assets. Do not add a remote `server.url` to the Capacitor configuration; the packaged app must not depend on downloading a hosted PWA at launch.
