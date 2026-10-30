# API contract: StitchFlow mobile ↔ mending backend

**Source of truth:** backend branch `origin/feature/tecnyne-10-14-2026-TEC9-91`, commit `a3d3272` (2026-10-27), read with `git -C ../backend show origin/feature/tecnyne-10-14-2026-TEC9-91:<path>` (the same branch is checked out in `backend/`'s working tree; never modify it). The earlier contract was read from `origin/check/branch-91.5`; §13 lists what changed. Real responses captured from a local run of this branch are in `../backend-local/samples/`.

**Designs:** the employee screens in `../UI/employee-figma-ui/` (E 1.1–E 6.1). Several designed features have no endpoint on this branch or any other (§9, Gaps 19–25); the app builds them against mocks behind `src/shared/config/features.ts` and their **proposed** endpoints are in §12.

This contract was derived from the code itself (controllers, DTOs, services, guards, Prisma schema). The backend's own `API_DOCUMENTATION.md` and the two `api_endpoints_documentation*.csv` catalogs predate the mobile endpoints (they still show a placeholder task shape and no `mobile/login`), so they are secondary. **There is no OpenAPI/Swagger spec** (`@nestjs/swagger` is not a dependency) and no type generator is used: DTO types and zod schemas are hand-written in each feature's `data/` folder.

Secrets (JWT secret, database URL, AWS keys, seed passwords) are intentionally not reproduced here.

---

## 1. Backend at a glance

| Item                       | Value                                                                                                                                                                                                                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language / framework       | TypeScript (ESM) on **NestJS 12**, Express adapter                                                                                                                                                                                                                               |
| Database                   | **PostgreSQL 16** via **Prisma 7** (`@prisma/adapter-pg`)                                                                                                                                                                                                                        |
| Auth                       | **JWT** (`@nestjs/jwt` + `passport-jwt`), bcrypt password hashes                                                                                                                                                                                                                 |
| File storage               | **AWS S3** (`@aws-sdk/client-s3`); uploads go through the API, never direct-to-S3                                                                                                                                                                                                |
| Validation                 | `class-validator` through a global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`                                                                                                                                                            |
| Default port               | **3000** (`PORT` env), bound to `0.0.0.0`, so a phone on the same Wi-Fi can reach it                                                                                                                                                                                             |
| Path prefix                | No global prefix; every controller declares `api/v1/...`                                                                                                                                                                                                                         |
| CORS                       | Requests **without** an `Origin` header (native apps) are always allowed                                                                                                                                                                                                         |
| Rate limiting / versioning | `@nestjs/throttler` with an app guard: `THROTTLE_LIMIT` per `THROTTLE_TTL` globally, and `THROTTLE_AUTH_LIMIT` (default 5) per minute on every `/auth/*` login, with a block duration. The signature upload is limited to 10 per minute. No API versioning beyond the `v1` path. |
| Health check               | `GET /` returns the plain string `Hello World!` (used by the Docker healthcheck)                                                                                                                                                                                                 |

### 1.1 Running it locally

Prerequisites: Node 20+, npm, Docker (for Postgres). Photo upload additionally needs an S3 bucket and credentials; without them the signature endpoint returns `500 AWS S3 is not configured on this server…` while everything else works.

```bash
cd backend
cp .env.example .env            # fill in DATABASE_URL, JWT_SECRET, AWS_* (names listed below)
npm install
docker compose up -d postgres   # Postgres 16 on port 5432 (POSTGRES_PORT)
npm run db:generate
npm run db:push                 # or: npm run db:migrate
npm run db:seed                 # default accounts, services, demo customers, orders, assignments
npm run start:dev               # http://localhost:3000
```

`./run.sh` (or `run.bat`) does all of the above in one go. Environment variable **names** used by the backend: `PORT`, `NODE_ENV`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_CUSTOM_DOMAIN`, `CORS_ALLOWED_ORIGINS`.

For mobile testing, use `../backend-local/` instead: a runnable export of this branch with Postgres on port 5433, an S3 mock on 9090, raised throttle limits, and a re-runnable mobile seed (`npm run db:seed:mobile`). Its `LOCAL_DEVELOPMENT.md` has the commands and test accounts, and `samples/` holds the responses this contract was checked against.

---

## 2. Conventions

### 2.1 Success envelope

Every JSON response is wrapped by a global `ResponseInterceptor`:

```jsonc
{
  "success": true,
  "statusCode": 200, // the HTTP status
  "message": "Success", // or a controller-provided message
  "data": {}, // payload: object, array, or null
  "timestamp": "2026-10-20T12:00:00.000Z",
}
```

Unwrapping rule the app must implement (`shared/api/httpClient`): **always read `data`.** When a controller returns an object that has a string `message` property, the interceptor lifts that string into the envelope and removes it from the payload; if the object also has a `data` property that becomes `data`, otherwise the remaining properties become `data` (or `null` when nothing is left). This is why login returns `data: { accessToken, tokenType, expiresIn, user }` and signature upload returns `data: { url }`.

### 2.2 Error envelope

Every failure is formatted by a global `AllExceptionsFilter`:

```jsonc
{
  "success": false,
  "statusCode": 400,
  "message": "…", // string, OR string[] for validation failures
  "error": "Bad Request", // HTTP error name, or null
  "timestamp": "2026-10-20T12:00:00.000Z",
}
```

`message` is an **array of strings** for `class-validator` failures (one entry per violated constraint, no field keys; see §7 for how the app maps them to fields) and a plain string otherwise. Non-HTTP exceptions become `500 Internal server error`; Prisma errors are mapped to `409` (unique constraint), `400` (foreign key) or `404 Record not found`.

Status codes and the exact messages the app may receive on the endpoints it uses:

| Status | Message (exact)                                                                                                               | Where                                                                            |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 400    | `["Mobile number is required", "Password must be at least 6 characters", …]`                                                  | login validation                                                                 |
| 400    | `["completedQuantity must be an integer number", "completedQuantity cannot be negative", "property foo should not exist", …]` | submit-work validation (`forbidNonWhitelisted` rejects unknown properties)       |
| 400    | `Validation failed (uuid v 4 is expected)`                                                                                    | any `:assignmentId` that is not a UUID v4                                        |
| 400    | `Cannot accept task with status SUBMITTED`                                                                                    | accept when status is not ASSIGNED / ACCEPTED / IN_PROGRESS                      |
| 400    | `You are not authorized to submit work for this assignment`                                                                   | submit-work by a different employee (note: 400, not 403)                         |
| 400    | `File is required in "file" form field`                                                                                       | signature upload without the multipart field                                     |
| 400    | `Invalid file type 'image/heic'. Allowed types: image/jpeg, image/png, image/webp, image/gif, image/svg+xml`                  | signature upload                                                                 |
| 400    | `File size exceeds limit of 5.0 MB`                                                                                           | signature upload                                                                 |
| 401    | `Incorrect mobile number or password.`                                                                                        | login: unknown identifier or wrong password                                      |
| 401    | `Your account is inactive. Please contact your supervisor.`                                                                   | login: `isActive === false`                                                      |
| 401    | `Authentication token is missing or invalid`                                                                                  | protected route: missing, malformed or **expired** Bearer token                  |
| 401    | `User account is invalid or deactivated` / `Account is invalid or deactivated`                                                | protected route: token valid but the user was deleted or deactivated since login |
| 403    | `Access denied: Required role [EMPLOYEE], user has role [SUPERVISOR]`                                                         | role guard                                                                       |
| 403    | `You are not authorized to accept this assignment`                                                                            | accept by a different employee                                                   |
| 403    | `You are not authorized to upload signature for this assignment`                                                              | signature upload by a different employee                                         |
| 404    | `Daily assignment "<uuid>" not found`                                                                                         | accept / signature / submit-work                                                 |
| 404    | `Employee not found` / `Supervisor not found`                                                                                 | profile                                                                          |
| 404    | `Record not found`                                                                                                            | Prisma P2025                                                                     |
| 409    | `Unique constraint violation on field: …` / `Mobile number '…' is already registered`                                         | profile update                                                                   |
| 500    | `Internal server error` / `AWS S3 is not configured on this server…` / `S3 upload failed: …`                                  | unexpected errors, S3 not configured, S3 failure                                 |

Mapping to the app's `ApiError` type (implemented in phase 5): no response → `network` or `timeout`; 401 on `/auth/mobile/login` → `unauthorized` with the server message shown verbatim (both strings match the Figma copy); 401 anywhere else → `unauthorized` (session ended, force logout); 403 → `forbidden`; 400 with `string[]` → `validation` with field errors; 400 with a string, and 409 → `validation` without field errors; 404 → `notFound`; ≥ 500 → `server`.

### 2.3 Authentication header

Protected routes require `Authorization: Bearer <accessToken>`. Requests with JSON bodies send `Content-Type: application/json`; the signature upload sends `multipart/form-data` (let the HTTP client set the boundary).

### 2.4 Dates and time zone

- All `DateTime` fields are serialized as ISO 8601 in **UTC** with a `Z` suffix, for example `2026-10-20T14:30:00.000Z`. Display them in device local time with dayjs.
- `assignmentDate` is a Postgres `DATE` column serialized as midnight UTC, for example `2026-10-20T00:00:00.000Z`. Treat it as a **calendar date**: take the first ten characters and never convert it to local time, or users west of UTC will see the previous day.
- The optional `date` query parameter must be `YYYY-MM-DD`. It is parsed with `new Date(value)` (UTC midnight) and compared for equality with `assignmentDate`, so the app should send its **local** calendar date. An unparseable value is not validated and produces a `500`.
- The `date` property echoed in the my-tasks response is the server's current UTC date when no parameter was sent; it is informational only.

### 2.5 Identifiers

Primary keys are UUID v4 strings (`id`). Users also have a human-readable `userId` such as `user00002` (this is the "employee ID" shown in the app). Route parameters named `:assignmentId` / `:id` are validated as UUID v4.

---

## 3. Authentication

### 3.1 Login

**`POST /api/v1/auth/mobile/login`** · public

The one login endpoint the app uses. It accepts a mobile number, a `userId`, or an email in the single `phone` field and works for every role.

Request body (`MobileLoginDto`):

| Field      | Type   | Rules                                                                     |
| ---------- | ------ | ------------------------------------------------------------------------- |
| `phone`    | string | required, non-empty (`Mobile number is required`)                         |
| `password` | string | required, **min 6 characters** (`Password must be at least 6 characters`) |

Identifier matching, in order: whitespace is stripped, then the server looks for a `User` (SUPERVISOR / EMPLOYEE) whose `phone` is one of the generated variants, or whose `userId` or `email` equals the value exactly; if none, it looks for an `Admin` by phone variants, `userName`, `adminId` or `email`. Phone variants are generated for Sri Lankan numbers only:

| Typed          | Also tried                   |
| -------------- | ---------------------------- |
| `+94771234567` | `0771234567`, `771234567`    |
| `0771234567`   | `+94771234567`, `771234567`  |
| `771234567`    | `+94771234567`, `0771234567` |

So the app can send exactly what the user typed (spaces removed) and let the server normalise. The design shows a fixed `+94` prefix; the app sends `+94` + the national digits, which the server matches directly. Non-Sri-Lankan seed accounts (for example `+1234567890`) must be typed in full, including the `+`. Anything that is not a number (an employee ID or email) is sent as typed; the field opens the phone keypad, so in practice that means a pasted value.

Response `200`:

```jsonc
{
  "success": true,
  "statusCode": 200,
  "message": "EMPLOYEE login successful",
  "data": {
    "accessToken": "<jwt>",
    "tokenType": "Bearer",
    "expiresIn": "7d",
    "user": {
      "id": "e0f76534-…", // uuid, the JWT subject
      "userId": "user00002", // employee ID shown in the app
      "role": "EMPLOYEE", // EMPLOYEE | SUPERVISOR | ADMIN | SUPERADMIN
      "name": "Kasun Fernando",
      "phone": "+94771234567",
      "imageUrl": null,
      "age": 28,
      "nic": "199612345678",
      "gender": "Male",
      "isActive": true,
      "email": "kasun.fernando@example.com",
      "createdById": "c8d54312-…",
      "createdAt": "2026-10-05T11:00:00.000Z",
      "updatedAt": "2026-10-05T11:00:00.000Z",
      "userType": "STAFF", // STAFF for User rows, ADMIN for Admin rows
    },
  },
  "timestamp": "…",
}
```

`user` is the full database row minus `password`; admin rows have `adminId`, `userName`, `companyName`, `responsiblePerson` instead of `userId`, `age`, `gender`. Every field other than `id`, `role`, `isActive`, `userType` is nullable.

Errors: `400` validation array; `401 Incorrect mobile number or password.`; `401 Your account is inactive. Please contact your supervisor.`

### 3.2 Token

- Signed HS256 JWT. Lifetime comes from `JWT_EXPIRES_IN`, default **7 days**; the login response echoes it as `expiresIn: "7d"`.
- Claims: `sub` (user uuid), `role`, `userId`, `phone`, `adminId`, `userName` (the last two only for admins), plus standard `iat` and `exp`. The app decodes the payload (no signature check) for identity only: `sub`, `role`, `userId`, `phone`. It does not expire sessions by the device clock (see Gap 1).
- **No refresh token and no refresh endpoint.** When the token expires every protected call returns `401 Authentication token is missing or invalid`; the app must log out and ask the user to sign in again.
- **No logout endpoint and no revocation list.** Logout is purely client-side (delete the token). Deactivating an account (`isActive = false`) does revoke access: `JwtStrategy.validate()` re-reads the user on every request and returns `401 User account is invalid or deactivated`.

### 3.3 Other login endpoints (not used by the app)

`POST /api/v1/auth/staff/login` (aliases `employee/login`, `supervisor/login`) matches `phone` exactly with no normalisation and returns `{ accessToken, user }` without `tokenType`/`expiresIn`/`userType`; `admin/login` and `superadmin/login` take `userName`. The app uses `mobile/login` only.

### 3.4 Roles

`SUPERADMIN`, `ADMIN` (table `admins`), `SUPERVISOR`, `EMPLOYEE` (table `users`). Which of the app's endpoints each role may call:

| Endpoint                                           | EMPLOYEE | SUPERVISOR | ADMIN / SUPERADMIN |
| -------------------------------------------------- | :------: | :--------: | :----------------: |
| `GET /orders/my-tasks`                             |    ✔     |     ✔      |         ✔          |
| `PATCH /orders/daily-assignments/:id/accept`       |    ✔     |     ✔      |         ✔          |
| `POST /orders/daily-assignments/:id/signature`     |    ✔     |     ✔      |         ✔          |
| `POST /orders/daily-assignments/:id/submit-work`   |    ✔     |     ✔      |         ✔          |
| `GET /employee/profile`, `PATCH /employee/profile` |    ✔     |     ✗      |         ✗          |
| `GET /employee/salary`                             |    ✔     |     ✗      |         ✗          |
| `PATCH /orders/daily-assignments/:id/reject`       |    ✔     |     ✔      |         ✔          |
| `GET /supervisor/profile`                          |    ✗     |     ✔      |         ✗          |
| `GET /admin/profile`, `GET /superadmin/profile`    |    ✗     |     ✗      |      ✔ (own)       |

Assignments are only ever created for users with role `EMPLOYEE`, and the profile, salary and earnings endpoints are EMPLOYEE-only. **The app is employee-only:** when the login response's `user.role` is anything else, it starts no session and shows "This app is for employees. Supervisors and admins use the web dashboard." in the sign-in alert.

---

## 4. Current user

**`GET /api/v1/employee/profile`** · Bearer · role EMPLOYEE
**`GET /api/v1/supervisor/profile`** · Bearer · role SUPERVISOR (identical shape)

Response `data`:

```jsonc
{
  "id": "e0f76534-…",
  "userId": "user00002",
  "name": "Kasun Fernando",
  "phone": "+94771234567",
  "role": "EMPLOYEE",
  "imageUrl": null,
  "age": 28,
  "nic": "199612345678",
  "gender": "Male",
  "email": "kasun.fernando@example.com",
  "isActive": true,
  "createdAt": "2026-10-05T11:00:00.000Z",
  "createdBy": {
    "id": "…",
    "adminId": "admin00001",
    "companyName": "Mending Corp",
    "userName": "admin",
  }, // nullable
}
```

Errors: `401`, `403` (wrong role), `404 Employee not found`.

The app picks the path from the `role` stored at login. There is no role-agnostic "me" endpoint (Gap 3). Profile (E 6.1) shows `name`, `userId` (as Employee ID), `phone`, `age` and `gender`. The design's Team and Supervisor rows are not in this payload, and an employee may not call the groups endpoints (Gap 20), so the app leaves them out.

### 4.2 Change password

**`PATCH /api/v1/employee/profile`** · Bearer · role EMPLOYEE · body `UpdateUserDto` (all optional: `name`, `phone`, `password` min 6, `imageUrl`, `nic`, `age` 16–100, `gender`, `email`, plus admin-only fields the service ignores). `PUT` is an alias.

The app's Change password screen sends only `{ "password": "<new>" }`. The backend hashes it with bcrypt and answers `{ message: "Profile details updated successfully", user: { …without password } }`; the response interceptor lifts a string `message` into the envelope, so `data` is `{ user }`. It does **not** ask for the current password, so the signed-in session is the only proof. Validation: `400 ["password must be at least 6 characters"]`, mapped to the New password field.

---

## 5. Tasks (daily assignments)

### 5.1 Model

A task in the app is an **`OrderDailyAssignment`** row: one employee, one order line, one calendar day. Prisma model (table `order_daily_assignments`):

| Field                                       | Type                   | Notes                                                                     |
| ------------------------------------------- | ---------------------- | ------------------------------------------------------------------------- |
| `id`                                        | uuid                   | the app's task id (`assignmentId` in the list)                            |
| `orderId`, `orderLineId`, `employeeId`      | uuid                   | relations; unique on `(orderId, orderLineId, employeeId, assignmentDate)` |
| `assignmentDate`                            | date                   | the working day; the app's due date                                       |
| `targetQuantity`                            | int, default 0         | the target                                                                |
| `acceptedAt`                                | datetime, nullable     | set by accept                                                             |
| `completedQuantity`                         | int, default 0         | set by submit-work (and review)                                           |
| `acceptedQuantity`                          | int, default 0         | optional on submit-work, authoritative after review                       |
| `customerSignatureUrl`                      | text, nullable         | the submitted photo: S3 URL, or a `data:` URI in seed data                |
| `workerNotes`                               | text, nullable         | the worker's note (also receives the assigner's note at creation)         |
| `submittedAt`                               | datetime, nullable     | set by submit-work                                                        |
| `reviewNotes`, `reviewedById`, `reviewedAt` | nullable               | set by the supervisor review                                              |
| `status`                                    | `TaskAssignmentStatus` | see below                                                                 |
| `assignedById`                              | uuid, nullable         |                                                                           |
| `createdAt`, `updatedAt`                    | datetime               |                                                                           |

`enum TaskAssignmentStatus { ASSIGNED, ACCEPTED, REJECTED, IN_PROGRESS, SUBMITTED, REVIEWED, CANCELLED }` — the exact values the app must use. This branch also adds `rejectedAt`, `rejectionReason` (set when the employee declines) and `prdNumber` (a production reference, nullable).

### 5.2 Transitions as implemented

The brief expected assigned → accepted → submitted → approved/rejected with resubmission. The backend differs, and the app follows the backend:

| From               | To                         | Actor                 | Endpoint                                               | Guard in code                                                                                                                                                   |
| ------------------ | -------------------------- | --------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (none)             | `ASSIGNED`                 | admin / supervisor    | `POST /orders/:id/daily-assignments` (not for the app) | upsert; re-assigning the same day only updates target and notes                                                                                                 |
| `ASSIGNED`         | `ACCEPTED`                 | the assigned employee | `PATCH …/accept`                                       | `ACCEPTED`/`IN_PROGRESS` → returns the row unchanged (200); any other status → `400`                                                                            |
| `ASSIGNED`         | `REJECTED`                 | the assigned employee | `PATCH …/reject` (`{ reason? }`)                       | `REJECTED` → unchanged (200); any other status → `400`. The app does not offer it (decision 2026-10-30: Accept and photo Submit only)                           |
| any                | `SUBMITTED`                | the assigned employee | `POST …/submit-work`                                   | ownership; not before the assignment date (Asia/Colombo); a signed photo URL must exist (sent or uploaded earlier); an EMPLOYEE's `acceptedQuantity` is ignored |
| any but `REVIEWED` | `REVIEWED`                 | supervisor / admin    | `PATCH …/review`                                       | `acceptedQuantity ≤ completedQuantity`; `400` once reviewed (final); rolls quantities up into the order line                                                    |
| —                  | `IN_PROGRESS`, `CANCELLED` | —                     | —                                                      | **never set by any code path on this branch**; handle them in the UI anyway                                                                                     |

There is **no supervisor approve / reject state**: `REJECTED` is the employee declining a task. A review sets `acceptedQuantity` (which may be lower than `completedQuantity`) and `reviewNotes`. The app's reading, with the employee designs' wording (E 3.1, E 3.2):

| Status                    | Pill (tone)        | Detail footer                    | Note under "My progress"                                                                                                                |
| ------------------------- | ------------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `ASSIGNED`                | Assigned (blue)    | **Accept task**                  | "Accept the task to start. Your supervisor records your daily output."                                                                  |
| `ACCEPTED`, `IN_PROGRESS` | In progress (blue) | **Submit today's work** (camera) | photograph the signed tally sheet and submit your count                                                                                 |
| `SUBMITTED`               | Submitted (teal)   | —                                | "Submitted. Your supervisor records your daily output." The backend would allow another submit-work; the app does not offer it (Gap 9). |
| `REVIEWED`                | Done (green)       | —                                | review card: accepted of reported pieces, plus `reviewNotes`. **Final.**                                                                |
| `REJECTED`                | Declined (grey)    | —                                | "You declined this task" with the reason                                                                                                |
| `CANCELLED`               | Cancelled (grey)   | —                                | "This task was cancelled."                                                                                                              |

Two derived pills win over the status while the work is open: **Overdue** (red, and the card gets a red border) when `assignmentDate` is before today, and **Rework** (amber) when the order line's service is a rework service (Gap 21). The list's chips are All, Due today (open, due today), Rework (rework-service tasks) and Done (`SUBMITTED` or `REVIEWED`); its subtitle counts open tasks ("4 assigned to you").

"My progress" shows Done (`completedQuantity`), Accepted (`acceptedQuantity`, after review) and Rejected (reported minus accepted, after review). The designed Rework tile has no data on this backend (Gap 21) and is left out.

### 5.3 Task list

**`GET /api/v1/orders/my-tasks`** · Bearer · all roles · query `date?: YYYY-MM-DD`

Returns **all** daily assignments of the authenticated user (any status, any date) ordered by `assignmentDate desc, createdAt desc`; `date` narrows to one day. No pagination, no status filter (Gaps 4 and 5).

Response `data`:

```jsonc
{
  "date": "2026-10-20", // echo of the query, or today's UTC date
  "totalTasks": 1,
  "tasks": [
    {
      "assignmentId": "33333333-…", // → Task.id
      "orderId": "11111111-…",
      "orderNumber": "ORD-2026-0142",
      "customerName": "Lanka Apparel Ltd", // nullable
      "location": "Biyagama factory", // customer site branch, or "Internal workshop"
      "orderLine": {
        "orderLineId": "22222222-…",
        "lineNumber": 1,
        "garmentDescription": "Men's Formal Shirts",
        "serviceName": "Mending & Stitch Repair", // nullable
        "serviceCode": "MEND", // nullable
        "color": "Blue / Navy Stripe", // nullable
        "size": "M - 15.5", // nullable
        "styleNumber": "BS-4902", // nullable
        "unitRate": 18, // LKR per piece (orderLine.unitEmployeeRate)
      },
      "unitRate": 18, // the same rate, top level
      "estimatedPayout": 2700, // targetQuantity × unitRate
      "completedPayout": 0, // completedQuantity × unitRate
      "acceptedPayout": 0, // acceptedQuantity × unitRate
      "assignmentDate": "2026-10-20T00:00:00.000Z", // calendar date, see §2.4
      "acceptedAt": null, // datetime | null
      "targetQuantity": 150,
      "completedQuantity": 0,
      "acceptedQuantity": 0,
      "customerSignatureUrl": null, // string | null (https URL, or data: URI in seed data)
      "status": "ASSIGNED",
      "notes": null, // workerNotes (note the different key)
      "reviewNotes": null,
      "submittedAt": null,
      "reviewedAt": null,
      "rejectedAt": null, // set when the employee declined
      "rejectionReason": null,
    },
  ],
}
```

The payout fields are what the earnings screens use for work still waiting for review (§11.2). All money values are plain JSON numbers (the backend converts its `Decimal` columns with `Number()`).

A near-duplicate **`GET /api/v1/employee/tasks`** (role EMPLOYEE only) returns the same list with the extra top-level `employeeId`, `userId`, `name`, `role`, the note under the key `workerNotes`, and **without** `acceptedAt`, `rejectedAt` and `rejectionReason`. The app uses `/orders/my-tasks` because it carries `acceptedAt`, works for every role, and lives beside the accept / signature / submit endpoints.

Errors: `401`; `500` for an unparseable `date`.

### 5.4 Accept

**`PATCH /api/v1/orders/daily-assignments/:assignmentId/accept`** · Bearer · all roles · no body

Sets `status = ACCEPTED` and `acceptedAt = now()`. Idempotent for `ACCEPTED` / `IN_PROGRESS` (returns the current row, 200).

Response `data` is the full assignment (the shape returned by accept, submit-work and review, called `DailyAssignmentDto` in the app):

```jsonc
{
  "id": "33333333-…",
  "orderId": "11111111-…",
  "orderLineId": "22222222-…",
  "employeeId": "e0f76534-…",
  "assignmentDate": "2026-10-20T00:00:00.000Z",
  "targetQuantity": 150,
  "completedQuantity": 0,
  "acceptedQuantity": 0,
  "customerSignatureUrl": null,
  "workerNotes": null,
  "submittedAt": null,
  "reviewNotes": null,
  "reviewedById": null,
  "reviewedAt": null,
  "status": "ACCEPTED",
  "assignedById": "d9e65423-…", // nullable
  "createdAt": "2026-10-20T08:00:00.000Z",
  "updatedAt": "2026-10-20T09:12:00.000Z",
  "employee": {
    "id": "…",
    "userId": "user00002",
    "name": "…",
    "phone": "…",
    "imageUrl": null,
    "isActive": true,
  }, // nullable
  "orderLine": {
    "id": "22222222-…",
    "lineNumber": 1,
    "garmentDescription": "Men's Formal Shirts",
    "serviceName": "Mending & Stitch Repair",
    "serviceCode": "MEND",
  }, // nullable; no color/size/style/customer here
  "reviewedBy": null, // { id, name, userName } | null  (userName actually carries the reviewer's userId)
  "acceptedAt": "2026-10-20T09:12:00.000Z",
}
```

Because this shape lacks `customerName`, `location`, `color`, `size`, `styleNumber` and `orderNumber`, the app merges it into the cached list item rather than replacing it.

Errors: `400 Validation failed (uuid v 4 is expected)`; `400 Cannot accept task with status X`; `401`; `403 You are not authorized to accept this assignment`; `404 Daily assignment "…" not found`.

### 5.5 Task detail

There is no single-assignment read endpoint for employees (`GET /orders/:id/daily-assignments` is admin/supervisor only; Gap 11). The detail screen reads the task from the cached list and the list is refetched after every mutation.

### 5.6 Order progress (optional)

**`GET /api/v1/orders/:id/progress`** · Bearer · all roles. Returns order-level totals (`summary: { received, completed, accepted, remaining, acceptedPercentage }`, per-line `services[]`, `expectedDeliveryDate`). Not needed for v1; available if the detail screen should show the order's delivery date later.

---

## 6. Submission

Submitting a task is **two requests**: upload the photo, then post the quantities with the returned URL. Both are keyed by the assignment id, so retries never create duplicate records (see Gap 8 for the trade-offs).

### 6.1 Step 1: upload the photo

**`POST /api/v1/orders/daily-assignments/:assignmentId/signature`** · Bearer · all roles · `multipart/form-data`

| Part   | Required | Rules                                                                                                                                           |
| ------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `file` | yes      | one image; MIME type must be one of `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`; **max 5 MB** (5 × 1024 × 1024 bytes) |

The app sends a compressed JPEG (`type: 'image/jpeg'`, filename ending in `.jpg`); the MIME type is taken from the multipart part, so the filename extension only decides the S3 key suffix. No other form fields are accepted. Ownership: an EMPLOYEE may upload only for their own assignment (`403`); SUPERVISOR / ADMIN may upload for anyone.

Server behaviour: deletes the previous signature object if one exists, then stores the file at `s3://<bucket>/<employeeId>/<orderId>/<timestamp>-<uuid>.jpg` and returns a public URL (`https://<bucket>.s3.<region>.amazonaws.com/<key>` or `<AWS_S3_CUSTOM_DOMAIN>/<key>`). The assignment row is **not** modified by this call; the URL only lands on the row through step 2.

Response `201`:

```jsonc
{
  "success": true,
  "statusCode": 201,
  "message": "Signature uploaded successfully to S3",
  "data": { "url": "https://…/e0f7…/1111…/1760950000000-9b1c….jpg" },
  "timestamp": "…",
}
```

Errors: `400 File is required in "file" form field`; `400 Invalid file type '…'. Allowed types: …`; `400 File size exceeds limit of 5.0 MB`; `401`; `403`; `404`; `500 AWS S3 is not configured on this server…`; `500 S3 upload failed: …`.

### 6.2 Step 2: submit the work

**`POST /api/v1/orders/daily-assignments/:assignmentId/submit-work`** · Bearer · all roles · JSON

Body (`SubmitDailyWorkDto`):

| Field                  | Type    | Required | Rules                                                                                                                           |
| ---------------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `completedQuantity`    | integer | **yes**  | `≥ 0` (`completedQuantity cannot be negative`, `completedQuantity must be an integer number`)                                   |
| `acceptedQuantity`     | integer | no       | `≥ 0`; when omitted the existing value is kept (the prototype app defaulted it to `completedQuantity`)                          |
| `customerSignatureUrl` | string  | no       | the URL from step 1. A `data:image/…;base64,…` string is also accepted and uploaded server-side, but the app never sends base64 |
| `workerNotes`          | string  | no       | **no length limit server-side** (Postgres `text`); when omitted the existing note is kept                                       |

Any other property → `400 property <name> should not exist`.

Effect: overwrites `completedQuantity`, `acceptedQuantity`, `customerSignatureUrl`, `workerNotes`, sets `submittedAt = now()` and `status = SUBMITTED` regardless of the previous status. Response `201`; `data` is the `DailyAssignmentDto` of §5.4 with `status: "SUBMITTED"` and `submittedAt` set.

Errors: `400` validation array; `400 You are not authorized to submit work for this assignment`; `401`; `404`.

A second route, `POST /api/v1/employee/assignments/:id/submit-work` (EMPLOYEE only), does the same without S3 handling and returns the bare row (no `employee` / `orderLine`). The app uses the `/orders` route.

### 6.3 Review (supervisor side, read-only for the app)

**`PATCH /api/v1/orders/daily-assignments/:assignmentId/review`** · SUPERADMIN / ADMIN / SUPERVISOR · body `{ acceptedQuantity (required, ≥ 0), completedQuantity?, customerSignatureUrl?, reviewNotes? }`. Enforces `acceptedQuantity ≤ completedQuantity`, sets `status = REVIEWED`, `reviewedAt`, `reviewedById`, and recomputes the order line's completed/accepted totals. The app only ever reads the result (`reviewNotes`, `acceptedQuantity`, `reviewedAt`).

### 6.4 How the app sends a submission (upload queue)

No screen calls §6.1 or §6.2 directly. The submit screen saves the submission on the device, and the upload queue (`src/features/submission/services/uploadQueue.ts`) sends it:

1. A `clientSubmissionId` (UUID v4, `expo-crypto`) names the queue item and its photo file. It is **not** sent: the backend rejects unknown properties (Gap 8).
2. The compressed photo (JPEG, longest side 1280 px, quality 0.7, always ≤ 5 MB) is copied into the app's document directory, and the item is persisted in MMKV, before any request is made.
3. Step 1 (§6.1) uploads the photo as `multipart/form-data`, field `file`, `image/jpeg`, file name `tally-sheet.jpg`. The returned URL is stored on the item at once, so a later attempt skips straight to step 2 (Gap 7).
4. Step 2 (§6.2) sends `completedQuantity` and `customerSignatureUrl`, plus `acceptedQuantity` and `workerNotes` only when the worker filled them in, since an omitted field keeps its stored value.
5. On success the photo file is deleted, the cached task is shown as `SUBMITTED` from the confirmed values, and the task list is refetched. Until then the task shows as "Submitting".

| Failure                                                     | What the queue does                                                                                            |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Network error or timeout while online, `5xx`, `408`, `429`  | Retries after 5 s, 10 s, 20 s… (doubling, at most 10 minutes); after 8 attempts the item waits as "failed"     |
| `400`, `403`, `404`, or a `2xx` body that breaks the schema | Fails at once (retrying cannot help) and shows the reason: the backend's own message for a single-string `400` |
| `401`                                                       | The session ends (Gap 1); the item waits, uncounted, until the same user signs in again                        |
| Connection lost mid-request, or the request cancelled       | Waits for the network, uncounted                                                                               |

Order: one upload at a time, oldest first, only for the signed-in user. A task's submission also waits while that task's accept is still pending on the device: submit-work has no status check (§5.2), so a submission that lands first would make the late accept fail with `400`.

The queue runs when the app starts (after the cached data is restored), when the device comes online, when the app returns to the foreground, when a user signs in, when a pending accept finishes, and when a backoff wait ends while the app is open. "Sync now" in the sync center retries every failed item that retrying can help.

---

## 7. Validation rules the app mirrors

| Where                 | Rule                                                                                                                | Source                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Login: identifier     | required, non-empty after trimming; the app also strips inner spaces                                                | `MobileLoginDto.phone`                        |
| Login: password       | required, min 6 characters                                                                                          | `MobileLoginDto.password`                     |
| Submit: completed qty | integer ≥ 0, required; **app-only:** at most 5 digits, against typos                                                | `SubmitDailyWorkDto`                          |
| Submit: accepted qty  | integer ≥ 0, optional; **app-only:** ≤ completed qty (the server only checks this at review time), at most 5 digits | `SubmitDailyWorkDto`, `reviewDailyAssignment` |
| Submit: note          | optional; **app-only:** max 500 characters (the server has no limit; see Gap 13)                                    | —                                             |
| Submit: photo         | JPEG, ≤ 5 MB after compression; the app targets ~1280 px longest side at quality 0.7, which lands well under 1 MB   | `S3Service` defaults                          |
| Route ids             | UUID v4                                                                                                             | `ParseUUIDPipe({ version: '4' })`             |
| `date` query          | `YYYY-MM-DD`, local calendar date                                                                                   | §2.4                                          |

Mapping `400` validation arrays to form fields: messages carry no field key, but every constraint message on the DTOs the app uses starts with a recognisable prefix. The data layer keeps a per-endpoint prefix table: `Mobile number` → `phone`, `Password` → `password`, `completedQuantity` → `completedQuantity`, `acceptedQuantity` → `acceptedQuantity`, `workerNotes` → `workerNotes`, `customerSignatureUrl` → `customerSignatureUrl`. Unmatched messages are shown as a form-level error.

---

## 8. Backend DTO → app `Task` model

As implemented in `src/features/tasks/data/taskMapper.ts`:

| App field                                                | Source                                                                                                                                                                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                                     | `assignmentId` (list) / `id` (mutation responses)                                                                                                                                                                  |
| `title`                                                  | "{service} · {targetQuantity} garments" as the designs title the work ("Mending · 120 garments"); the garment description stands in for a missing service, and "Task" for both; no quantity when the target is 0   |
| `garment`                                                | `{ description: garmentDescription, color, size, styleNumber }` for the detail rows Style ("Denim jacket · Indigo"), Style no. and Sizes                                                                           |
| `payout`                                                 | `{ unitRate, estimated: estimatedPayout, completed: completedPayout, accepted: acceptedPayout }`, recomputed from the quantities when a field is missing                                                           |
| `rejectionReason`                                        | `rejectionReason` (the employee's reason for declining)                                                                                                                                                            |
| `serviceName`, `orderNumber`, `customerName`, `location` | the same-named fields, kept for the card and the detail screen                                                                                                                                                     |
| `status`                                                 | `status` (exact enum value)                                                                                                                                                                                        |
| `dueDate`                                                | `assignmentDate` as a calendar date (`YYYY-MM-DD`); overdue = an open status (ASSIGNED, ACCEPTED, IN_PROGRESS) and a date before today (local), shown as "Overdue N days"                                          |
| `target.value`                                           | `targetQuantity` (0 means no target)                                                                                                                                                                               |
| `target.unit`                                            | **not provided** by my-tasks (Gap 10); the app shows "garments", as designed                                                                                                                                       |
| `target.achieved`                                        | `acceptedQuantity` when status is REVIEWED, otherwise `completedQuantity`                                                                                                                                          |
| `acceptedAt`                                             | `acceptedAt`                                                                                                                                                                                                       |
| `instructions`                                           | `notes` while `submittedAt` is null: before submission the column holds the assigner's note (Gap 18)                                                                                                               |
| `latestSubmission`                                       | null until `submittedAt` is set; then `{ photoUrl: customerSignatureUrl, note: notes, submittedAt, completedQuantity, acceptedQuantity }`                                                                          |
| `review`                                                 | once REVIEWED (or `reviewedAt` is set): `{ reviewedAt, notes: reviewNotes, acceptedQuantity, completedQuantity }`. The brief's `rejectionReason` is `review.notes`, since the backend has no reject state (Gap 9). |

The list is validated item by item: a row that breaks the schema is dropped and reported to Sentry, and the rest of the list still shows.

`customerSignatureUrl` may be an `https://` URL or, in seed data, a `data:image/svg+xml;utf8,…` string; `expo-image` can render both, and the mapper passes the string through unchanged.

---

## 9. Gaps

Each gap lists what the app needs, what the branch has, a minimal backend change for the backend developer, and the mobile-side workaround used until then. Nothing in `backend/` was changed.

| #   | Topic                                           | Backend today                                                                                                                                                                                                                                                                                                             | Proposed minimal backend change                                                                                                                                                                                                                                                                                                                        | Mobile workaround now                                                                                                                                                                                                                                                                                |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Token refresh**                               | Single 7-day access JWT; no refresh token or endpoint.                                                                                                                                                                                                                                                                    | Issue a long-lived refresh token at login, add `POST /api/v1/auth/refresh` (`{ refreshToken }` → new pair) and store a per-user refresh-token version so logout/deactivation can revoke it. Shorten the access token to ~1 hour once refresh exists.                                                                                                   | Keep the 7-day token in SecureStore; on any `401` outside login, clear the session and route to login. The app does not log out by the device clock: field phones often have a wrong clock, and waiting for the server's `401` keeps cached tasks visible and queued submissions safe while offline. |
| 2   | **Logout**                                      | No endpoint; nothing to revoke.                                                                                                                                                                                                                                                                                           | `POST /api/v1/auth/logout` that invalidates the refresh token (with Gap 1).                                                                                                                                                                                                                                                                            | Client-side only: delete tokens, clear MMKV, query cache and stores.                                                                                                                                                                                                                                 |
| 3   | **Current-user endpoint**                       | Role-specific `GET /employee/profile`, `/supervisor/profile`, `/admin/profile`, `/superadmin/profile`, each guarded to its own role.                                                                                                                                                                                      | Add `GET /api/v1/auth/me` returning the sanitized user for whichever role the token carries.                                                                                                                                                                                                                                                           | Read `role` from the token and choose the path accordingly. Until the profile loads, or when it fails, the profile shows the employee ID and phone from the token; admin accounts show only those.                                                                                                   |
| 4   | **Task list pagination**                        | `GET /orders/my-tasks` returns every assignment of the user, unbounded; only `date` filters. (`GET /orders` has `page`/`limit`, my-tasks does not.)                                                                                                                                                                       | Add `page`, `limit` (default 20) and a `from`/`to` date range to my-tasks, returning `{ items, meta: { page, limit, total, totalPages } }` like `GET /orders`.                                                                                                                                                                                         | One query, cached and persisted; the FlashList renders the full array. Infinite-query plumbing is written against the proposed `meta` shape but currently receives a single page. Volume is small (one row per employee per line per day).                                                           |
| 5   | **Status filter**                               | None on my-tasks (exists only on the supervisor's `GET /orders/:id/daily-assignments?status=`).                                                                                                                                                                                                                           | Accept `status` (single value or comma list) on my-tasks.                                                                                                                                                                                                                                                                                              | Filter chips are applied client-side over the cached list.                                                                                                                                                                                                                                           |
| 6   | **Accept endpoint**                             | ✔ Exists and is idempotent.                                                                                                                                                                                                                                                                                               | Return `409` instead of `400` for a status conflict so the app can distinguish it from validation errors.                                                                                                                                                                                                                                              | Treat `400 Cannot accept task with status …` as a conflict: refetch the task and show its real status.                                                                                                                                                                                               |
| 7   | **Photo submission**                            | Two calls (multipart upload, then JSON submit). Limits: 5 MB, image MIME types. S3 must be configured even in development.                                                                                                                                                                                                | Accept the photo on `submit-work` itself as `multipart/form-data` (`file` + the four fields) so a submission is one atomic request; optionally add a local-disk storage driver for development.                                                                                                                                                        | The upload-queue job has two persisted steps: `upload` (stores the returned URL on the queue item) then `submit`. A retry after a successful step 1 skips straight to step 2, so a crash between the calls never re-uploads.                                                                         |
| 8   | **Idempotency key (`clientSubmissionId`)**      | None. Submit-work is an overwrite keyed by assignment id, so a retried submit cannot create a duplicate row, but a retried step 1 creates (and then replaces) another S3 object.                                                                                                                                          | Accept an optional `clientSubmissionId` (uuid) on submit-work and the signature upload, store it on the assignment, and return the stored result unchanged when the same id is sent again.                                                                                                                                                             | The app generates `clientSubmissionId` per queue item today and keeps it in the queue record so it can be sent as soon as the field exists; until then it is used only locally, as the queue item's id and the photo's file name (§6.4).                                                             |
| 9   | **Supervisor rejection / resubmission**         | `REJECTED` now exists but means the **employee** declined (`PATCH …/reject`). A review still produces `REVIEWED` with `acceptedQuantity ≤ completedQuantity` and free-text `reviewNotes`; review refuses an already-reviewed row. Submit-work has no status guard, so re-submission is technically allowed before review. | Add a supervisor "send back" outcome (or a separate `REWORK` state, see Gap 21) and guard submit-work to `ACCEPTED`/`IN_PROGRESS` (and the send-back state).                                                                                                                                                                                           | `REVIEWED` is final. The detail screen shows the review card (accepted of reported pieces, `reviewNotes`). The app does not offer a second submit while `SUBMITTED`, and does not offer Decline.                                                                                                     |
| 10  | **Target unit and due date fields**             | `targetQuantity` is present; the unit (`orderLine.trackingUnit`, e.g. `Bundle (1 bundle = 12 garments)`) and the order's `expectedDeliveryDate` are **not** in the my-tasks payload.                                                                                                                                      | Add `orderLine.trackingUnit` and `order.expectedDeliveryDate` to the my-tasks task object.                                                                                                                                                                                                                                                             | Unit shown as "garments" (the designs' word); due date = `assignmentDate`.                                                                                                                                                                                                                           |
| 11  | **Single-task detail endpoint**                 | None for employees.                                                                                                                                                                                                                                                                                                       | `GET /api/v1/orders/daily-assignments/:assignmentId` for the assignment's own employee (same `DailyAssignmentDto`), including customer/location/order fields.                                                                                                                                                                                          | Detail reads from the cached list; mutation responses are merged into the cached item; list refetched after each mutation.                                                                                                                                                                           |
| 12  | **Validation error field mapping**              | `400` bodies carry `message: string[]` with no field names.                                                                                                                                                                                                                                                               | Return `errors: { field: string[] }` alongside `message` (a custom `exceptionFactory` on the `ValidationPipe`).                                                                                                                                                                                                                                        | Prefix table per endpoint (§7); unmatched messages become a form-level error.                                                                                                                                                                                                                        |
| 13  | **Note length**                                 | `workerNotes` is unlimited `text`.                                                                                                                                                                                                                                                                                        | `@MaxLength(500)` on `workerNotes` (and `reviewNotes`).                                                                                                                                                                                                                                                                                                | App-side zod limit of 500 characters; documented as app-only.                                                                                                                                                                                                                                        |
| 14  | **Account deactivated mid-session**             | Returns `401 User account is invalid or deactivated` on the next request; indistinguishable by status from an expired token.                                                                                                                                                                                              | Use a distinct code (`403` with `error: "AccountInactive"`) for deactivated accounts.                                                                                                                                                                                                                                                                  | Any non-login `401` logs the user out; the login screen then shows the backend's inactive-account message on their next attempt.                                                                                                                                                                     |
| 15  | **`IN_PROGRESS` / `CANCELLED`**                 | Defined in the enum but never set by any code path on this branch.                                                                                                                                                                                                                                                        | Either set `IN_PROGRESS` on accept (and drop `ACCEPTED`), or remove the unused values; add a cancel endpoint if cancellation is a real flow.                                                                                                                                                                                                           | The app handles both defensively: `IN_PROGRESS` behaves like `ACCEPTED`, `CANCELLED` is read-only.                                                                                                                                                                                                   |
| 16  | **API documentation**                           | `API_DOCUMENTATION.md` and both CSV catalogs predate the mobile endpoints and show a placeholder task shape.                                                                                                                                                                                                              | Add `@nestjs/swagger` and decorate the DTOs, or regenerate the catalog, so this contract can be diffed against a spec. (No type generator is added on the mobile side without approval.)                                                                                                                                                               | This document is the contract; it names the commit it was read from.                                                                                                                                                                                                                                 |
| 17  | **Transport security**                          | HTTP only; TLS is expected to be terminated by the deployment (Nginx on port 80 in the CI workflow).                                                                                                                                                                                                                      | Serve the API over HTTPS in preview and production.                                                                                                                                                                                                                                                                                                    | Development builds allow cleartext to local hosts; preview/production builds require an `https://` `EXPO_PUBLIC_API_URL`.                                                                                                                                                                            |
| 18  | **Assigner and worker notes share one column**  | `workerNotes` receives the assigner's note when the assignment is created and the worker's note on submit-work, which overwrites it (or keeps it when the worker sends none).                                                                                                                                             | Store the assigner's note in its own column (for example `assignmentNotes`) and return it as a separate field in my-tasks.                                                                                                                                                                                                                             | Before submission the app shows `notes` as Instructions; after submission as the worker's note. A submission without a note may therefore show the assigner's text as the worker's.                                                                                                                  |
| 19  | **Forgot password (E 1.4–1.6)**                 | No password reset, OTP or SMS anywhere in the backend.                                                                                                                                                                                                                                                                    | `POST /auth/mobile/password-reset/request` (`{ phone }` → `{ resendAfterSeconds, expiresInSeconds }`, sends a 6-digit SMS code, rate limited), `…/verify` (`{ phone, code }` → `{ resetToken }`, short-lived, single use), `…/complete` (`{ resetToken, newPassword }`). Answer `request` the same way for unknown numbers to avoid account discovery. | Built against a mock (code `123456`) behind `features.passwordReset`, which is on only in mock mode, so the "Forgot password?" link does not show against the real backend. Proposed shapes in §12.                                                                                                  |
| 20  | **Team and supervisor on the profile (E 6.1)**  | Groups and their supervisors exist, but `GET /employee/profile` returns neither and the groups endpoints are ADMIN-only.                                                                                                                                                                                                  | Add `groups: [{ id, name, supervisor: { id, name } }]` to the employee profile payload.                                                                                                                                                                                                                                                                | The Team and Supervisor rows are left out of Profile, and the Supervisor row out of the task detail.                                                                                                                                                                                                 |
| 21  | **Rework (E 3.1, E 3.2)**                       | No rework status or quantity. Rework only exists as a service in the catalogue (the seed's `Rework` service).                                                                                                                                                                                                             | If rework is a review outcome, store `reworkQuantity` (and rejected) on the assignment at review time and expose them in my-tasks.                                                                                                                                                                                                                     | A task whose service name contains "rework" shows the Rework pill while open, and the Rework chip filters those tasks. The progress tiles show Done, Accepted and Rejected (= reported − accepted after review); the designed Rework tile is left out.                                               |
| 22  | **Withdrawal requests (E 5.1–5.5)**             | Payouts are recorded by an admin after the fact (`POST /admin/employees/:id/payments`, `EmployeeSalaryPayment`). An employee cannot request one, and there is no pending/rejected state.                                                                                                                                  | `POST /employee/withdrawals` (`{ amount, payoutAccountId }`, `amount ≤ remainingBalance − pending`) and `GET /employee/withdrawals` with `PENDING / PAID / REJECTED`, a reference such as `WD-2026-0031`, and the account; the admin's payment approves a request. Hold pending amounts in `remainingBalance`.                                         | The request, review and sent screens run against a mock behind `features.withdrawalRequests` (mock mode only). Against the real backend the Withdraw tab shows the payout history built from the salary's recorded payments (all "Paid"), and Home's button reads "View payouts".                    |
| 23  | **Payout account (E 5.1, E 6.1)**               | No bank account on the user.                                                                                                                                                                                                                                                                                              | `GET /employee/payout-account` → `{ id, bankName, bankCode, branchName, accountHolderName, accountNumberLast4, verified }`, maintained by admins.                                                                                                                                                                                                      | Mock only, behind `features.payoutAccount`; the Profile row and the "Payout to" card are hidden against the real backend.                                                                                                                                                                            |
| 24  | **Pending earnings and periods (E 4.1, E 4.2)** | `GET /employee/salary` lists `REVIEWED` work only and has no date filter; nothing reports work waiting for review.                                                                                                                                                                                                        | Add `from`/`to` to the salary endpoint and a `pendingAssignments` list (submitted, not reviewed) with `completedQuantity × rate`.                                                                                                                                                                                                                      | Pending rows and the estimate come from my-tasks (`SUBMITTED`, `completedPayout`); the period is filtered on the phone (§11.2).                                                                                                                                                                      |
| 25  | **Task detail extras (E 3.2)**                  | No defect description, no reference photos, no supervisor on the assignment.                                                                                                                                                                                                                                              | Add `defectDescription` and `referencePhotoUrls[]` to the order line (or assignment) and the assigner's name to my-tasks.                                                                                                                                                                                                                              | The Defect and Supervisor rows are left out; the photo tiles show the submitted tally-sheet photo only.                                                                                                                                                                                              |

---

## 10. Seed data (for manual testing)

`backend-local/` runs `npm run db:seed` (the backend's seed) and then `npm run db:seed:mobile`, which resets the test employee's data relative to the day it runs (re-run it on the day you test; dates are Asia/Colombo days). All accounts share the main seed's default password from `prisma/seed.ts`, deliberately not repeated here. Type the number with `+94`, `0` or neither.

| Phone                               | Account                                          | What it has                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| +94 77 123 4567                     | Kasun Fernando, `user00006`, EMPLOYEE (28, Male) | 14 tasks for Lanka Apparel Ltd (Biyagama site or "Internal workshop"): today Mending 120 ACCEPTED and Rework 14 ASSIGNED (for Accept); yesterday one ACCEPTED without a photo (for Submit) and one SUBMITTED 184/190; one REJECTED; Coloring 80 overdue by 6 days; Mending 60 in 3 days; 7 REVIEWED in the last 2–9 days with photos in S3Mock. Salary: LKR 25,560 approved, 10,000 paid in three bank transfers, 15,560 balance (the Figma Home figures). |
| +94 71 234 5673                     | Sunethra Bandara, inactive                       | sign-in refused: "Your account is inactive. Please contact your supervisor." (checked before the password)                                                                                                                                                                                                                                                                                                                                                 |
| +94 71 234 5671 / 5672, +1234567890 | Kamal Perera, Nimal Silva, John Doe              | one REVIEWED task each                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| +9876543210                         | Jane Smith, SUPERVISOR                           | the app refuses it (employee-only, §3.4); the employee endpoints answer `403`                                                                                                                                                                                                                                                                                                                                                                              |

Order numbers are `ORD-2026-0151` to `0154` (the backend's own format; the main seed already uses 0138, 0142 and 0143 for other customers). Services: Mending (LKR 18 a piece), Coloring (32), Rework (10).

### 10.1 Behaviour seen on the local run

- `GET /orders/my-tasks` without `date` returns every assignment; its `date` field is today's **UTC** date. An unparsable `date` (for example `30-10-2026`) is a `500`.
- `GET /employee/salary` reports `branchName: null` for workshop orders, where the task lists say "Internal workshop".
- `POST …/submit-work` has no status check: submitting a `REVIEWED` task sets it back to `SUBMITTED` and drops it out of the salary. The app never offers a submit outside `ACCEPTED`/`IN_PROGRESS`.
- A handler that returns `{ message, ...rest }` gets `message` lifted into the envelope and `data = rest` (the signature upload's `data` is `{ url }`; the password change's is `{ user }`).
- The photo URL from S3Mock (`http://localhost:9090/mending-local/<employee>/<order>/<file>.jpg`) downloads with the uploaded bytes; on a USB phone it needs `adb reverse tcp:9090 tcp:9090`.
- The login limit (5 a minute) is read when the auth controller is imported, before `.env` loads, so `backend-local` starts with `npm run start:local` (`--env-file .env`) to raise it.

The app's zod schemas, mappers and domain rules were run over these responses on 2026-10-30: every item parsed, and Home, Earnings and Withdraw computed LKR 15,560 available, 25,560 approved and 10,000 withdrawn.

---

## 11. Earnings and payouts

### 11.1 Salary

**`GET /api/v1/employee/salary`** · Bearer · role EMPLOYEE · no query

Response `data`:

```jsonc
{
  "employee": {
    "id": "e0f7…",
    "userId": "user00006",
    "name": "Kasun Fernando",
    "role": "EMPLOYEE",
  },
  "salarySummary": {
    "totalEarned": 25552, // Σ earnedAmount of every REVIEWED assignment, all time
    "totalPaid": 10000, // Σ amount of every recorded payment
    "remainingBalance": 15552, // max(0, totalEarned − totalPaid)
    "totalAcceptedGarments": 1054,
    "paymentCount": 2,
    "currency": "LKR",
  },
  "acceptedAssignments": [
    {
      "assignmentId": "…",
      "orderId": "…",
      "orderNumber": "ORD-2026-0142",
      "customerName": "Lanka Apparel Ltd",
      "branchName": "Biyagama", // nullable
      "garmentDescription": "Denim jacket",
      "serviceName": "Mending",
      "serviceCode": "MEND", // nullable
      "assignmentDate": "2026-10-07T00:00:00.000Z", // calendar date, §2.4
      "targetQuantity": 190,
      "completedQuantity": 192,
      "acceptedQuantity": 190,
      "unitEmployeeRate": 18,
      "earnedAmount": 3420, // acceptedQuantity × unitEmployeeRate, rounded to cents
      "reviewedAt": "…",
      "workerNotes": null,
      "reviewNotes": "Two pieces sent back for rework.",
      "customerSignatureUrl": "…",
    },
  ],
  "payments": [
    {
      "id": "…",
      "paymentNumber": "SAL-2026-0027",
      "amount": 6000,
      "currency": "LKR",
      "paymentMethod": "BANK_TRANSFER", // BANK_TRANSFER | CASH | CHEQUE | ONLINE_CARD
      "paidAt": "…", // timestamp
      "referenceNumber": "BOC-TRX-88213", // nullable
      "notes": null,
      "paidBy": "Admin User",
      "createdAt": "…",
    },
  ],
}
```

Lists are newest first. Both arrays are validated item by item. Errors: `401`, `403` (not an employee), `404 Employee not found`. Admins record payments with `POST /api/v1/admin/employees/:id/payments` (`RecordEmployeePaymentDto`: `amount` > 0 with up to 2 decimals, optional `paymentMethod`, `referenceNumber`, `notes`, `paidAt`); the app never calls it.

### 11.2 How the screens use it

| Screen value                                     | Source                                                                                                                                                                        |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Available to withdraw (Home, Earnings, Withdraw) | `remainingBalance` minus requests still pending (mock only; always 0 against the real backend)                                                                                |
| Home "Approved X – withdrawn Y"                  | `totalEarned`, `totalPaid` (all time)                                                                                                                                         |
| Home Items / Accepted / Est. earnings            | this month: reported pieces of reviewed and submitted work, accepted pieces of reviewed work, and approved + pending amounts                                                  |
| Earnings period ("1–9 Oct 2026", Change)         | client-side presets: this month (1st to today), last month, last 7 days, last 30 days                                                                                         |
| Estimated earnings / Approved earnings           | for the period: approved = Σ `earnedAmount` by `assignmentDate`; estimated = approved + pending, where pending = Σ `completedPayout` of my-tasks rows in `SUBMITTED` (Gap 24) |
| Already withdrawn / Available                    | all time (`totalPaid`, available as above), so "Available" always matches Home and Withdraw                                                                                   |
| Approved earnings by day (chart)                 | Σ `earnedAmount` per `assignmentDate` for each day of the period                                                                                                              |
| Earnings history rows                            | approved: one per `acceptedAssignments` item (items = accepted pieces); pending: one per `SUBMITTED` task (items = reported pieces); order numbers shortened to "ORD-0142"    |
| Withdrawal history (real backend)                | `payments`, each "Paid", reference = `paymentNumber`, account column = the payment method                                                                                     |

---

## 12. Proposed endpoints and feature flags

`src/shared/config/features.ts` turns these on only when `EXPO_PUBLIC_USE_MOCK_API=true`. Each has an http api already written against the proposed path in `endpoints.proposed`, so enabling it later means confirming the shapes below with the backend team, then flipping the flag.

| Flag                 | Screens                                                         | Proposed endpoints (`endpoints.proposed`)                                                                                                                                                                                                                                                                     |
| -------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `passwordReset`      | Forgot password, Enter the code, New password (E 1.4–1.6)       | `POST /api/v1/auth/mobile/password-reset/request` `{ phone }` → `{ resendAfterSeconds, expiresInSeconds }`; `…/verify` `{ phone, code }` → `{ resetToken }`; `…/complete` `{ resetToken, newPassword }` → `{ message }`                                                                                       |
| `withdrawalRequests` | Withdraw, Review request, Request sent, Withdrawals (E 5.1–5.5) | `GET /api/v1/employee/withdrawals` → `{ withdrawals: [{ id, referenceNumber, amount, currency, status: PENDING \| PAID \| REJECTED, requestedAt, decidedAt, rejectionReason, payoutAccount: { bankName, bankCode, accountNumberLast4 } }] }`; `POST` same path `{ amount, payoutAccountId }` → one withdrawal |
| `payoutAccount`      | Payout to card, Profile → Payout account                        | `GET /api/v1/employee/payout-account` → `{ id, bankName, bankCode, branchName, accountHolderName, accountNumberLast4, verified }`                                                                                                                                                                             |

Money requests are never queued offline: Submit request needs a connection.

---

## 13. Changes since `check/branch-91.5`

- `REJECTED` status with `rejectedAt` / `rejectionReason`, and `PATCH /orders/daily-assignments/:id/reject` for the employee.
- my-tasks adds `unitRate`, `estimatedPayout`, `completedPayout`, `acceptedPayout` (and `orderLine.unitRate`), plus `rejectedAt` / `rejectionReason`.
- `GET /employee/salary` (§11.1) and admin-recorded salary payments (`EmployeeSalaryPayment`).
- Submit-work now refuses a future assignment date and requires a signed photo URL; an EMPLOYEE's `acceptedQuantity` is ignored. Review refuses an already-reviewed row.
- Rate limiting (`@nestjs/throttler`), with a stricter limit on every login endpoint.
- `POST /employee/assignments/:id/submit-work` exists as an alias of the orders route; the app keeps using the orders route.
- The employee profile's `PATCH` is reachable (the 91.5 branch had a syntax error there), and the app uses it for Change password (§4.2).
