# StitchFlow mobile (employee app) — rules for AI sessions

Read `AGENTS.md` first (Expo-specific guidance: fetch the versioned docs, never trust memory). Then follow these project rules. They summarise the project brief; when a rule and the brief disagree, the brief wins.

## Sources of truth

- `../backend/` (read-only): endpoints, request/response shapes, auth, validation, status values, error format. The written contract is `docs/API_CONTRACT.md`; it names the backend branch it was derived from (`feature/tecnyne-10-14-2026-TEC9-91`, which is also the branch checked out in `backend/`'s working tree). Only update the contract from that branch, read with `git -C ../backend show origin/<branch>:<path>`. Never check out, fetch, modify, move, or delete anything in `backend/`. Real responses captured from the local run are in `../backend-local/samples/`.
- `../UI/employee-figma-ui/` (read-only): the 17 employee screens (E 1.1–E 6.1) for layout, wording, colors, typography, spacing, component styles. Measured values live in `docs/DESIGN_INVENTORY.md`. PNG pixels are not design units: frames are 390 × 844 at @1x. Colors read from PNGs are estimates and carry `// TODO: verify from Figma` in `colors.ts`. (`../UI/supervisor-figma-ui.zip` is the supervisor app's design and is out of scope.)
- Sample web (`../backend/frontend`, the admin dashboard) and test mobile (`../backend/mobile`, the backend team's JS prototype) show how the backend team calls the API; neither is a design source.
- The brief: architecture, folder structure, state management, behaviour, performance. If two sources conflict, list the conflict and ask; never pick one silently.
- Designed features the backend does not support yet (forgot password / OTP, withdrawal requests, payout account) are built against their mock api and gated by `shared/config/features.ts`, which turns them on only in mock mode. Their proposed endpoints are in `endpoints.proposed`, and API_CONTRACT §9 lists the gaps.
- App code never imports from `backend/`, `UI/` or `figma-ui/` (lint-enforced). Never copy secrets, keys, passwords, or connection strings from backend config into this app or its docs.

## Working agreement

- Run `npm run typecheck`, `npm run lint` and `npm test` before calling any change done, and fix every error. (The original build ran in numbered phases with a stop after each; the 2026-10-30 rebuild to the employee designs ran end to end at the user's request.)
- Ask before adding any package not already in `package.json`. Install native packages with `npx expo install`.
- After building a screen, compare it with its PNG and list differences you could not match.

## Architecture (feature layout)

Every feature under `src/features/<name>/` uses the same layout:

| Folder        | Contains                                                                                                                    | Must not                                |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `api/`        | raw HTTP calls through `shared/api/httpClient`, plus a mock implementation returning exact backend DTO shapes               | business logic                          |
| `data/`       | DTO types and zod schemas that match the backend exactly, DTO → app-model mappers, repositories, query keys                 | React imports                           |
| `domain/`     | pure TypeScript rules (`canAcceptTask`, `isOverdue`, `getTargetProgress`…)                                                  | React or react-native imports           |
| `hooks/`      | view-model hooks (`useTaskListViewModel`) combining queries, stores, and domain rules; return only data, flags, and actions | JSX                                     |
| `components/` | presentational: props in, JSX out                                                                                           | API calls, store access, business rules |
| `screens/`    | call one view-model hook and compose components                                                                             | business logic                          |
| `types.ts`    | app models                                                                                                                  |                                         |
| `index.ts`    | the feature's public exports                                                                                                |                                         |

- Route files in `src/app/` only re-export a screen: `export { default } from '@/features/tasks/screens/TaskListScreen';`
- Features import from `shared/` and from other features' `index.ts` only (lint-enforced).
- Feature barrels must not import each other in a cycle. `submission` depends on `tasks`, so `tasks/index.ts` exports nothing that imports `@/features/submission`; the tasks view-models and screens may import it because the barrel does not export them.
- Path alias `@/` → `src/`. No `any`. Explicit return types on exported functions. When the backend changes, only `data/` (and `api/`) should need updating.

## API layer

- Base URL from `EXPO_PUBLIC_API_URL` via `shared/config/env.ts`. All paths live in `shared/api/endpoints.ts` and match `docs/API_CONTRACT.md`.
- The backend wraps responses as `{ success, statusCode, message, data, timestamp }`; `httpClient` unwraps `data`. Errors are `{ success: false, statusCode, message (string | string[]), error, timestamp }`.
- Normalise every failure into one `ApiError` (network, timeout, unauthorized, forbidden, validation with field errors, notFound, server) with user-friendly messages. Show field errors on the matching form fields.
- Parse backend dates with dayjs (utc plugin) and display in device local time.
- Mock mode: `EXPO_PUBLIC_USE_MOCK_API=true` swaps each feature's `api/` for its mock, which returns exact backend DTO shapes with small delays.
- `shared/api` and `shared/lib` have no barrel file: import the module you need (`@/shared/api/httpClient`, `@/shared/lib/logger`), because `httpClient`, `logger` and `sentry` read the env at import time. Tests use `createHttpClient` with a fake adapter instead.
- The api/ layer returns `unknown`; the data/ layer validates it with `parseResponse(schema, payload, url)`, which reports contract drift to Sentry. Mock api implementations fail through `mockApiError`, so they produce the same ApiErrors as the server.
- List payloads go through `parseItems`, so one row that breaks the schema is dropped and reported instead of hiding the whole list.
- Explicit sign-out lives in the profile view-model. It warns while the user has unsent submissions or offline accepts, then calls `discardUploadsOf(user.id)` and `endSession('signedOut')`, which deletes the token and clears the query cache in memory and on disk.
- The session belongs to the auth feature (`initializeSession`, `endSession`). The HTTP client reaches it through `configureHttpAuth`, so `shared/` never imports a feature. A `401` ends the session (no refresh endpoint yet); the upload queue is never cleared by an expired session.

## Design and styling

- Theme tokens only: `shared/theme/` exports colors (semantic tokens plus a task-status map), spacing, radius, typography, iconSizes, and `scale`/`verticalScale`/`moderateScale` computed once from the screen's short side against the 390 × 844 base.
- Components never contain hex colors or raw numbers for spacing, font size, radius, or icon size. Always `StyleSheet.create`; no inline style objects. Lint enforces `react-native/no-color-literals` and `react-native/no-inline-styles`.
- Static styles use `StyleSheet.create` and are read as `styles.name`. A variant map that is read with a computed key (`variantStyles[variant]`) is a plain typed object (`Record<Variant, ViewStyle>`), because `react-native/no-unused-styles` only understands dot access; `StyleSheet.create` is identity at runtime, so nothing is lost.
- Fonts: Inter static faces are bundled by the expo-font plugin; `typography.ts` maps each weight to its own family name (`Inter-SemiBold`), so set `fontFamily` through the text variants and never `fontWeight`.
- Prefer flex and percentages over fixed sizes. `AppText` sets `maxFontSizeMultiplier` ≈ 1.3. Light theme only, portrait only, dark status-bar content (light on the sign-in screen's teal header, approved, and over the live camera viewfinder).
- Use the shared components (`Screen`, `AppText`, `Button`, `TextField`, `FormTextField`, `Card`, `Header`, `Badge`, `Loader`, `EmptyState`, `ErrorState`, `ConfirmDialog`, `Divider`, `Icon`, `NetworkBanner`, and the others listed in `docs/DESIGN_INVENTORY.md`) instead of raw primitives wherever they apply.
- Icons come from `@expo/vector-icons` through `shared/ui/Icon` (Feather, plus four Material Community outline glyphs the designs need and Feather lacks: `wallet`, `banknote`, `bank`, `list-checks`). Import icon families per file (`@expo/vector-icons/Feather`), never from the package root, which bundles every icon font (about 4 MB). Both fonts load behind the splash screen. Logos and illustrations are exported assets in `assets/`, never cropped from screenshots. Ignore dark-mode designs.

## State management

- TanStack Query for all server data; query keys in one file per feature; task list `staleTime` 1–2 minutes; cache persisted to MMKV; `onlineManager` wired to NetInfo and `focusManager` to AppState.
- Accept task: mutation with optimistic update, rollback on error, then invalidate task queries.
- Zustand only for client state: session store (user, auth status), the persisted upload-queue store, and its in-memory upload-progress store. Always read with selectors, never the whole store.
- Tokens live only in expo-secure-store. Never in MMKV, persisted state, or logs.
- Local UI state (captured photo URI, camera ready) stays in the view-model hook. Forms use react-hook-form with zod schemas mirroring backend validation.

## Submissions and the upload queue

- Screens never call the submission API. `enqueueSubmission` saves a submission on the device and the upload queue (`features/submission/services/uploadQueue.ts`) sends it in two steps, photo then submit-work. `docs/API_CONTRACT.md` §6.4 describes retries, ordering and what each failure does.
- Change the queue only through the service (`retryUpload`, `retryAllUploads`, `discardUpload`, `discardUploadsOf`) and read it through the hooks in `features/submission/hooks/useUploads.ts`. Progress lives in its own in-memory store, so lists do not re-render on every upload step.
- Queue items store the photo's file name, never its URI: iOS moves the app's data folder when the app updates. Resolve it with `queuedPhotoUri`.
- The queue starts after the persisted query cache is restored (`AppProviders`), because a task's submission waits for that task's pending accept, and pending accepts only exist after the restore.
- Items belong to the user who made them and upload only in their session. An expired session never clears the queue; an explicit sign-out discards the user's own items only after they confirm.
- Camera: expo-camera's `CameraView` only, mounted only while the screen is focused and the app is in the foreground. Photos travel as file URIs; compress them through `imageCompressor` and delete the camera original. The submit screen accepts a photo URI parameter only from the app's cache (`isCapturedPhotoUri`), so a deep link cannot make it upload another file.

## Errors and logging

- `shared/lib/sentry.ts`: DSN and environment from env, release and build filled in by the native SDK; `tracesSampleRate` 0.1; no session replay; disabled in development unless `EXPO_PUBLIC_SENTRY_ENABLE_IN_DEV=true`. Root is wrapped with Sentry and an error boundary with a friendly fallback.
- `shared/lib/logger.ts` (react-native-logs): debug/info/warn/error. Development logs to console; production sends warn as a Sentry breadcrumb and error to `captureException` with endpoint, status code, and ApiError type.
- `no-console` everywhere except the logger. Sentry user is the employee ID only. Never log tokens, passwords, or image data. Breadcrumbs for login, task accepted, photo captured, submission queued, upload success, upload failure.

## Tests

- Jest (`jest-expo`) runs in UTC with test values for the env schema (see `jest.config.js`). Testing Library 14's `render` is async: always `await` it.
- Fixtures live in a feature's `__fixtures__/` folder (anything in `__tests__/` is treated as a test file). Shared helpers live in `src/test-utils/`, for example `settleWithTimers` for mock apis with simulated delays.
- Mock `@/shared/lib/logger` in tests that reach `parseResponse`, and mock a feature's `api` module to test its repository.
- react-native-mmkv runs on its own in-memory store under Jest (`jest.setup.ts` stubs Nitro), so persisted zustand stores work in tests. Give a test's `QueryClient` mutations `gcTime: Infinity`, or their garbage-collection timers keep Jest running.

## Performance (low-end Android)

- FlashList for every list; memoised items; no heavy work in `renderItem`.
- Zustand selectors only. `expo-image` for every image. No base64 images in state; compress photos (longest side ≈ 1280 px, JPEG ≈ 0.7) before upload and pass file URIs only.
- Keep the startup path light, avoid unnecessary animations, and load only the font weights actually used.
