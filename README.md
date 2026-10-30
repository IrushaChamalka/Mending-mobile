# StitchFlow mobile

Employee app for workshop staff, built to the employee designs in `../UI/employee-figma-ui` (E 1.1–E 6.1). Employees sign in, see today's and upcoming tasks, accept them, submit the completed work with a photo of the signed tally sheet (even with weak or no network), follow their approved and pending earnings, and see their payouts.

Some designed features have no backend endpoint yet: forgot password with an SMS code, withdrawal requests, and the payout account. They are built against mocks and appear only in mock mode (`src/shared/config/features.ts`); `docs/API_CONTRACT.md` §9 lists what the backend needs to add.

Built with Expo SDK 58 (React Native 0.88, React 19), TypeScript strict mode, Expo Router, TanStack Query, Zustand, MMKV and the React Compiler. It runs as a development build (`expo-dev-client`); Expo Go is not supported because of the native modules.

## Setup

1. Install Node 22 or newer and npm. For local native builds also install Xcode (iOS) and Android Studio with an emulator, or connect a device.
2. Install dependencies:
   ```sh
   cd mobile
   npm install
   ```
3. Create the env file and fill it in (see [Environment variables](#environment-variables)):
   ```sh
   cp .env.example .env
   ```
4. Build and launch a development build. This is needed on the first run and after native changes; afterwards `npm start` is enough:
   ```sh
   npm run android   # or: npm run ios
   ```
   Or build in the cloud with `npx eas-cli@latest build --profile development --platform android`. Run `npx eas-cli@latest init` once first, and add the printed `projectId` to `app.config.ts` under `extra.eas`.

## Scripts

| Script                                    | What it does                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| `npm start`                               | Start the Metro dev server for a development build                           |
| `npm run android` / `npm run ios`         | Build the native app locally and run it on an emulator, simulator, or device |
| `npm run lint` / `npm run lint:fix`       | ESLint (Expo config plus react-native rules); zero warnings allowed          |
| `npm run typecheck`                       | `tsc --noEmit` in strict mode                                                |
| `npm test` / `npm run test:watch`         | Jest with `jest-expo` and Testing Library                                    |
| `npm run format` / `npm run format:check` | Prettier                                                                     |
| `npm run doctor`                          | `expo-doctor` dependency and config check                                    |

A husky pre-commit hook runs lint-staged (ESLint fix and Prettier on staged files) and the type check.

## Environment variables

All variables are listed in `.env.example`. Only `EXPO_PUBLIC_*` values are bundled into the app, so never put secrets in them.

| Variable                                            | Purpose                                                                                                                                 |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`                               | Backend base URL, for example `https://api.example.com`. A trailing slash is ignored                                                    |
| `EXPO_PUBLIC_USE_MOCK_API`                          | `true` runs the whole app against in-app mock data instead of the backend                                                               |
| `EXPO_PUBLIC_SENTRY_DSN`                            | Sentry DSN; empty disables error reporting                                                                                              |
| `EXPO_PUBLIC_SENTRY_ENABLE_IN_DEV`                  | `true` also reports from development builds                                                                                             |
| `EXPO_PUBLIC_APP_ENV`                               | `development`, `preview`, or `production`. Sent to Sentry as the environment; anything but `development` requires an `https://` API URL |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | Build-time only: source-map upload by the Sentry Expo plugin. Without a token the upload step is skipped, so local builds still succeed |

`src/shared/config/env.ts` validates these with zod at startup and is the only place that reads `process.env`. An invalid value stops the app at launch with a message naming the variable.

### Mock mode

With `EXPO_PUBLIC_USE_MOCK_API=true` the app runs without a backend: sign-in, the profile, the task list and earnings built from the designs' sample data, accepting, submitting with simulated upload progress, and the mock-only features (forgot password, withdrawal requests, payout account). Sign in with any password of six or more characters:

| Type after +94 | Account                     | Result                  |
| -------------- | --------------------------- | ----------------------- |
| 77 123 4567    | Kasun Fernando, user00006   | signs in                |
| 71 234 5671    | Kamal Perera, user00003     | signs in                |
| 71 234 5672    | Nimal Silva, user00004      | signs in                |
| 71 234 5673    | Sunethra Bandara, user00005 | inactive-account error  |
| `+9876543210`  | Jane Smith, supervisor      | employees-only error    |
| anything else  |                             | incorrect-details error |

The accounts mirror the backend seed; the seed's real password is deliberately not used. In the forgot-password flow the SMS code is always `123456`. Mock data lives in memory, so it resets when the app restarts.

## Pointing the app at a locally running backend

The backend listens on port 3000 by default. Set `EXPO_PUBLIC_API_URL` according to where the app runs:

| App runs on          | `EXPO_PUBLIC_API_URL`                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Android emulator     | `http://10.0.2.2:3000` (the emulator's alias for your computer's localhost)                                                         |
| iOS simulator        | `http://localhost:3000`                                                                                                             |
| Physical device      | `http://<your computer's LAN IP>:3000`, with the phone on the same Wi-Fi                                                            |
| Android phone on USB | `http://localhost:3000`; `npm run android` first runs `adb reverse` for port 3000 and for 9090, where a local S3 mock serves photos |

`../backend-local/LOCAL_DEVELOPMENT.md` runs the backend branch the app is built against (`feature/tecnyne-10-14-2026-TEC9-91`), its database and an S3 mock in Docker, with mobile test data and real response samples in `../backend-local/samples/`.

Cleartext HTTP is allowed in development builds only. Preview and production builds must use HTTPS: the env check refuses an `http://` URL unless `EXPO_PUBLIC_APP_ENV` is `development`. Restart Metro with `npm start -- --clear` after changing `.env`, because Expo inlines the values when it bundles.

## How the app works

- **Features** live in `src/features/<name>/`, each with the same layers: `api/` (raw HTTP calls plus a mock), `data/` (zod DTO schemas, mappers, repositories, query keys), `domain/` (pure rules), `hooks/` (view-model hooks), `components/` (presentational), `screens/`, `types.ts` and a public `index.ts`. Route files in `src/app/` only re-export a screen. `CLAUDE.md` holds the full rules.
- **Server data** goes through TanStack Query. The cache is persisted to MMKV, so the last tasks show instantly on a cold start and while offline. NetInfo drives the online state and AppState the focus state.
- **Offline work.** Accepting a task offline is a paused mutation that survives restarts and is sent when the network returns. A submission is saved on the phone first, then the upload queue sends the photo and the counts, retrying with backoff. The sync center lists anything not yet on the server. `docs/API_CONTRACT.md` §6.4 describes the queue in detail.
- **Sessions.** The access token is kept only in expo-secure-store. A `401` ends the session; queued submissions stay and upload after the same user signs in again. Signing out from the profile warns about unsent work, then deletes the user's queued submissions, the token and all cached data.
- **Errors** are normalised into one `ApiError` with user-facing messages. `src/shared/lib/logger.ts` prints to the console in development and sends warnings and errors to Sentry in preview and production. The Sentry user is the employee ID only.

## Folder structure

```
mobile/
├── docs/
│   ├── API_CONTRACT.md       # endpoints, models, validation, upload queue, backend gaps
│   └── DESIGN_INVENTORY.md   # screen map, tokens, components, differences from the designs
├── assets/                   # app icon, splash, Inter fonts
├── src/
│   ├── app/                  # Expo Router routes only (one-line files that re-export screens)
│   │   ├── _layout.tsx       # Sentry wrap, providers, auth guard
│   │   ├── (auth)/           # login, forgot-password, verify-code, new-password
│   │   └── (app)/            # signed-in area
│   │       ├── (tabs)/       # Home, Tasks, Earnings, Withdraw, Profile; each tab but Home is a stack
│   │       ├── capture/[id]  # camera (full screen, above the tabs)
│   │       ├── submit/[id]   # counts, note and photo, then "Work submitted"
│   │       └── sync.tsx      # sync center
│   ├── features/
│   │   ├── auth/             # sign-in, session, token, forgot password (mock)
│   │   ├── home/             # balance, this month's numbers, today's tasks
│   │   ├── tasks/            # task list, detail, accept
│   │   ├── submission/       # camera, compression, submit, upload queue, sync center
│   │   ├── earnings/         # salary, earnings overview and history
│   │   ├── withdrawals/      # balance held by requests, payouts, request flow (mock), payout account (mock)
│   │   └── profile/          # profile, change password, sign-out
│   ├── shared/
│   │   ├── api/              # httpClient, ApiError, endpoints, response parsing, mock helpers
│   │   ├── config/           # env.ts, app info, locale
│   │   ├── hooks/            # useIsOnline, useIsAppActive, useToday
│   │   ├── lib/              # storage, secure storage, logger, Sentry, network, query client
│   │   ├── theme/            # colors, spacing, radius, typography, sizes, scale
│   │   ├── ui/               # the shared components (Screen, AppText, Button, TextField…)
│   │   └── utils/            # dates, numbers, phone numbers, redaction
│   ├── providers/            # AppProviders, one-time startup, splash readiness, error fallback
│   └── test-utils/           # shared test helpers
├── app.config.ts             # Expo app config (light theme, portrait, plugins)
├── eas.json                  # EAS Build profiles: development, preview, production
├── eslint.config.js, .prettierrc, jest.config.js, jest.setup.ts, lint-staged.config.js
├── CLAUDE.md                 # rules for AI-assisted sessions
└── README.md
```

## How to add a new feature

The `profile` feature is the smallest complete example to copy.

1. **Contract first.** Read the endpoint on the backend branch named in `docs/API_CONTRACT.md`, document it there, and add its path to `src/shared/api/endpoints.ts`.
2. **Create the folders** `src/features/<name>/api`, `data`, `domain`, `hooks`, `components` and `screens`, plus `types.ts` and `index.ts`.
3. **`api/`**: an interface with one method per call, an `http…Api` implementation that calls `httpClient` and returns the response's `data` as `unknown`, and a mock implementation that returns the exact backend DTO shape, waits with `mockDelay`, and fails with `mockApiError`. `api/index.ts` picks one by `env.useMockApi`.
4. **`data/`**: zod schemas in `dto.ts` that mirror the backend, mappers to the app models in `types.ts`, query keys in `queryKeys.ts`, and a repository that validates every payload with `parseResponse` (or `parseItems` for lists). A mutation that must survive an offline restart registers `setMutationDefaults` from `src/providers/initializeApp.ts`.
5. **`domain/`**: the feature's rules as pure functions, with unit tests.
6. **`hooks/`**: query hooks, and one view-model hook per screen that returns only data, flags and actions.
7. **`components/` and `screens/`**: presentational components built from `src/shared/ui` and theme tokens, and a screen that calls its view-model hook. No hex colors, raw sizes or inline styles; lint enforces this.
8. **Route**: add a one-line file under `src/app/`, inside `(app)` for signed-in screens: `export { default } from '@/features/<name>/screens/<Name>Screen';`
9. **Public surface**: export from `index.ts` only what other features need. Features import each other only through `index.ts` (lint-enforced), and two barrels must never import each other.
10. **Check**: `npm run typecheck && npm run lint && npm test`.

## Testing

`npm test` runs Jest with `jest-expo`. Tests sit in `__tests__/` next to the code and fixtures in `__fixtures__/`. They cover:

- the task rules, target progress and filters, and the DTO mappers;
- the upload queue: retries, backoff, failures, ordering, sign-in and discard;
- the image compressor, with the manipulator and file system mocked;
- the HTTP client, ApiError mapping, the env check, and the form schemas;
- the profile view-model, including the sign-out warning.

Conventions: Testing Library 14's `render` and `renderHook` are async, so always `await` them. Mock `@/shared/lib/logger` in tests that reach `parseResponse`. MMKV runs on its built-in in-memory store, so persisted stores work in tests.

## Builds and releases

`eas.json` has three profiles:

| Profile       | What it builds                                                     |
| ------------- | ------------------------------------------------------------------ |
| `development` | Development client (APK on Android) for `npm start`                |
| `preview`     | Internal-distribution release build (APK) against the real backend |
| `production`  | Store build (Android App Bundle), build number incremented by EAS  |

Set `EXPO_PUBLIC_API_URL` (HTTPS) and `EXPO_PUBLIC_SENTRY_DSN` as EAS environment variables for the preview and production environments. Add `SENTRY_AUTH_TOKEN` as a secret with `SENTRY_ORG` and `SENTRY_PROJECT` to upload source maps.

Before the first store release:

- confirm the bundle identifier and package name in `app.config.ts`;
- replace the placeholder icon, adaptive icon and splash, and the logo mark in `src/shared/ui/AuthHeader.tsx`, with exports from Figma (`docs/DESIGN_INVENTORY.md` §10);
- link the EAS project (`npx eas-cli@latest init`);
- serve the backend over HTTPS (`docs/API_CONTRACT.md` Gap 17).

## Docs

- `docs/API_CONTRACT.md`: endpoints, auth, models, validation rules, the upload queue, and the backend gaps with proposed fixes.
- `docs/DESIGN_INVENTORY.md`: screen map, palette, typography, spacing, components, assets, and every known difference from the designs.
- `CLAUDE.md`: the project rules for AI-assisted sessions; `AGENTS.md`: Expo-specific guidance.
