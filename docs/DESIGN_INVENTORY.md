# Design inventory: StitchFlow employee app

**Current source (2026-10-30):** the 17 employee PNGs in `../UI/employee-figma-ui/` (E 1.1–E 6.1, 390 × 844 @1x). They use the same design system as the earlier StitchFlow set (Tailwind v3 slate/teal palette, Inter, flat cards, Lucide-style outline icons), so the tokens, type scale and components measured below in Part 2 still apply. Colors on the new screens were re-sampled with a PNG decoder and every one landed on an existing token (blue-50/600 info pills, red-300 overdue border, amber-50 instructions, teal-50 progress tile, teal-700 → teal-900 gradients).

# Part 1. Employee designs (E-series)

## E1. Screen map

| File                             | App route                                                            | Status                                                                                                                  |
| -------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `E 1.1 Login`                    | `(auth)/login`                                                       | Built. Subtitle "Sign in to see your tasks and earnings." "Forgot password?" shows only in mock mode (no backend flow). |
| `E 1.2 Wrong details`            | login error state                                                    | Built; the alert text is the backend's 401 message.                                                                     |
| `E 1.3 Inactive account`         | login error state                                                    | Built; also the backend's message.                                                                                      |
| `E 1.4 Forgot password`          | `(auth)/forgot-password`                                             | Built against a mock (`features.passwordReset`).                                                                        |
| `E 1.5 OTP verification`         | `(auth)/verify-code`                                                 | Built against a mock; six boxes over one hidden input so SMS autofill and paste work.                                   |
| `E 1.6 New password`             | `(auth)/new-password`; also `profile/change-password` (real backend) | Built; the strength meter is shared with Change password.                                                               |
| `E 2.1 Home`                     | `(tabs)/index`                                                       | Built: greeting header, balance card, three tiles, Today's tasks.                                                       |
| `E 3.1 My tasks`                 | `(tabs)/tasks`                                                       | Built: subtitle, chips All / Due today / Rework / Done, task cards.                                                     |
| `E 3.2 Task detail`              | `(tabs)/tasks/[id]`                                                  | Built, plus the backend's Accept and photo Submit in the footer (undesigned; decision 2026-10-30).                      |
| `E 4.1 Earnings overview`        | `(tabs)/earnings`                                                    | Built; "Change" opens a period sheet (undesigned).                                                                      |
| `E 4.2 Earnings history table`   | `(tabs)/earnings/history`                                            | Built.                                                                                                                  |
| `E 5.1 Request withdrawal`       | `(tabs)/withdraw`                                                    | Mock only (`features.withdrawalRequests`); against the real backend the tab shows the payout history.                   |
| `E 5.2 Request – over balance`   | withdraw error state                                                 | Mock only.                                                                                                              |
| `E 5.3 Review request`           | `(tabs)/withdraw/review`                                             | Mock only.                                                                                                              |
| `E 5.4 Request sent`             | `(tabs)/withdraw/sent`                                               | Mock only.                                                                                                              |
| `E 5.5 Withdrawal history table` | `(tabs)/withdraw/history`                                            | Built; real data = admin-recorded payments (all Paid).                                                                  |
| `E 6.1 Profile`                  | `(tabs)/profile`                                                     | Built; Payout account row mock only.                                                                                    |

Undesigned screens kept from the earlier build: camera (`capture/[id]`), submit form and "Work submitted" (`submit/[id]`), sync center (`sync`). Undesigned and new: payout account detail (`profile/payout-account`, `withdraw/payout-account`), change password (reuses E 1.6), the period sheet.

## E2. Navigation

Five tabs, as on every E screen: Home (`home`), Tasks (`list-checks`), Earnings (`banknote`), Withdraw (`wallet`), Profile (`user`). The four non-Feather glyphs come from Material Community Icons' outline set (`shared/ui/Icon`). Tasks, Earnings, Withdraw and Profile are stacks, so their detail screens keep the tab bar as the PNGs show (E 3.2, E 4.2, E 5.3). Camera, submit and sync open full screen above the tabs.

## E3. New measurements and tokens

| Item                            | Value                                                                                                                        | Token / component                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Balance amount (E 2.1)          | Inter Bold 32/38, white                                                                                                      | `textVariants.amount`                                          |
| Overdue card border             | red-300, 1 px                                                                                                                | `Card tone="danger"`                                           |
| Status pills                    | In progress / Assigned blue-50 + blue-600; Overdue red-50 + red-600; Rework amber-50 + amber-700; Done green; Submitted teal | `getTaskBadge`, `taskStatusTone`                               |
| Task photo tile (E 3.2)         | 72 × 72, radius 12, slate-200                                                                                                | `sizes.photoTile`                                              |
| Table header / row (E 4.2, 5.5) | 38 / 52 dp, overline column titles, 1 px dividers, radius 16 card                                                            | `shared/ui/Table`                                              |
| Chart (E 4.1)                   | bars teal-700, empty days slate-200 (3 dp), 96 dp plot                                                                       | `colors.chartBar`, `colors.chartBarEmpty`, `sizes.chartHeight` |
| OTP box (E 1.5)                 | 58 dp, radius 12, 2 px teal focus                                                                                            | `sizes.otpBox`                                                 |
| Strength bar (E 1.6)            | 4 segments, 5 dp, green when strong                                                                                          | `sizes.strengthBar`, `PasswordStrengthMeter`                   |
| Amount field (E 5.1)            | 64 dp, 2 px teal focus, bold value                                                                                           | `sizes.amountInput`                                            |

## E4. Differences from the PNGs that could not be matched

- **E 2.1 Home:** the tiles count this month (the designs do not say which period). The withdraw button reads "View payouts" against the real backend (requests are mock only). With a pending request the line under the balance adds "– pending N" so the numbers add up.
- **E 3.1 My tasks:** "Rework" is derived from the service name; the backend has no rework status (API_CONTRACT Gap 21). Location reads "Internal workshop" where the design says "Workshop", because that is the backend's text.
- **E 3.2 Task detail:** no Defect or Supervisor rows and no reference photos (Gaps 20, 25); the photo tiles show the submitted tally-sheet photo once there is one. "My progress" has three tiles (Done, Accepted, Rejected); Rework has no data. The blue note changes with the status, keeping the design's sentence "Your supervisor records your daily output." Accept task / Submit today's work buttons sit in the footer (undesigned).
- **E 4.1 Earnings:** Already withdrawn and Available are all time (so Available matches Home and Withdraw), while Estimated and Approved follow the period. "Change" offers four presets in a bottom sheet instead of a calendar.
- **E 4.2 Earnings history:** "Subtotal" fits its column instead of being clipped.
- **E 6.1 Profile:** no Team or Supervisor rows (Gap 20); the employee ID is the backend's `userId` (for example `user00006`), not "EMP-0021". The app version shows under Sign out.
- **Logo:** the brand tile still uses a Feather placeholder until the StitchFlow mark is exported (Part 2 §10).

- **E 1.4–1.6 Forgot password:** mock only. With an empty new password the meter shows "Use at least 6 characters." in grey so the layout does not jump. Strength levels are Weak / Fair / Strong / Very strong (3 of 4 segments = "Strong password", as drawn). OTP boxes are 58 dp tall against about 60 in the PNG.
- **E 5.1 Request withdrawal:** the bank tile is blue-50 with a blue-600 icon; the PNG's sky-100 / sky-700 are not in the theme. A "View withdrawal history" link sits under the info banner (the designs only reach E 5.5 after sending a request).
- **E 5.5 Withdrawals:** the account caption reads "BOC ···· 4421" (the PNG's "BOC ·4421"); the gap between amount and status is the table's shared 4 dp. References are shortened like order numbers ("WD-0031", or "SAL-0003" for an admin-recorded payout). Against the real backend the subtitle reads "Payouts from your admin".
- **Filter chips** stay 38 dp everywhere; E 5.5's are about 34.

# Part 2. Design system (measured on the earlier StitchFlow set, still valid)

## Original inventory: figma-ui → StitchFlow mobile

**Source:** the 19 PNG exports in `../figma-ui/` (18 screens plus `Header.png`), every one viewed on 2026-10-22. Values were measured by sampling pixels with a small PNG decoder, not by eye, and cross-checked against last session's inventory (`../figma-ui/DESIGN_INVENTORY.md`, which this file supersedes; see §13 for the differences).

**Confidence.** Every flat color is an exact **Tailwind CSS v3** palette value, so the hexes below are reliable; they still carry `// TODO: verify from Figma` in `colors.ts` because a PNG cannot prove a design token. Sizes, gaps and radii were read from pixel runs and are exact to ±1 px. Font sizes and weights were fitted last session by comparing text widths with Inter's metrics and are reliable to ±0.5 px and one weight step; this session spot-checked line pitches and cap heights but did not refit them.

**Frame and scale.** Every screen is **390 × 844 px**, the iPhone 14/15 frame, exported at **@1x** (the 1 px hairlines and 2 px focus borders confirm it). So 1 PNG px = 1 dp. `shared/theme/scale.ts` uses a **390 × 844** base.

**Style in one line:** flat, no shadows, 1 px slate borders, white cards on a slate-50 page, teal-700 primary, teal gradients on the auth header and hero cards, Inter type, Lucide-style outline icons.

**Scope applied (decisions of 2026-10-22):** the app is the brief's employee task flow; the designs are the design system plus the screens that overlap. Of the designed screens that are not in the brief, only the success screen is built. Camera only, no gallery.

---

## 1. Screen map

| File                          | What it shows                                                                                                                                                   | App route                            | v1 status                                                                                                                                                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `M 1.1 Login`                 | Gradient header with logo tile, wordmark, "Welcome back" + subtitle; white sheet with mobile number (🇱🇰 +94), password, forgot link, Sign in, "or", footer note | `(auth)/login`                       | **Build as designed.** The +94 field matches the backend's mobile login. "Forgot password?" is omitted (no backend flow); see §12.                                                                       |
| `M 1.2 Wrong details`         | Login with red alert "Incorrect mobile number or password."                                                                                                     | `(auth)/login` error state           | **Build as designed.** The string is exactly what the backend returns.                                                                                                                                   |
| `M 1.3 Inactive account`      | Login with alert "Your account is inactive. Please contact your supervisor."                                                                                    | `(auth)/login` error state           | **Build as designed.** Also exactly the backend string.                                                                                                                                                  |
| `M 1.4 Forgot password`       | Gradient header with back button, mobile number, "Send code"                                                                                                    | none                                 | Out of v1 (no backend). Reference for `AuthHeader` back-button variant.                                                                                                                                  |
| `M 1.5 OTP verification`      | Six code cells, resend countdown                                                                                                                                | none                                 | Out of v1. Reference for the 2 px focus border.                                                                                                                                                          |
| `M 1.6 New password`          | New + confirm password, strength meter                                                                                                                          | none                                 | Out of v1.                                                                                                                                                                                               |
| `M 2.1 Home`                  | Avatar greeting header with sync pill, gradient hero card, three KPI tiles, "My teams" cards, earnings row, 5-tab bar                                           | `(app)/index` (task list)            | **Reference only.** The task list borrows its header, sync pill, bordered cards and status pills. No dashboard.                                                                                          |
| `M 3.1 Teams`                 | Root header with subtitle, team cards with stats, info banner                                                                                                   | none                                 | **Reference.** `TaskCard` is modelled on the team card; the info banner is the `Banner.info` variant.                                                                                                    |
| `M 3.2 Team members`          | Back header, search field, avatar list rows, bottom CTA                                                                                                         | none                                 | Reference for list rows and the bottom CTA layout.                                                                                                                                                       |
| `M 3.3 Member details`        | Avatar + name + pills, info-row card, four tinted stat tiles, earnings card                                                                                     | none                                 | **Reference.** Task detail uses the info-row card and tinted stat tiles; Profile uses the avatar block.                                                                                                  |
| `M 4.1 Member counts`         | Stepper 1/3, per-member count inputs, focused input                                                                                                             | none                                 | **Reference.** The submit screen's quantity inputs use the count-input style; focused state = 2 px teal.                                                                                                 |
| `M 4.2 Final document photo`  | Stepper 2/3, 350 × 250 photo placeholder, Retake / Choose from gallery, "saved on this device" banner, bottom CTA                                               | `tasks/[id]/capture` (preview state) | **Adapted.** Gallery button dropped (camera only); the live viewfinder is undesigned (§11). The success banner becomes the "saved on this device" queue notice.                                          |
| `M 4.3 Review & submit`       | Stepper 3/3, two summary tiles, member table, attached-photo card with "Change", "Submit output" with send icon                                                 | `tasks/[id]/submit`                  | **Adapted.** Photo card + summary tiles + submit button as designed; the table is replaced by the quantity fields and note (§1.1).                                                                       |
| `M 4.4 Submitted`             | Success mark, title, two-line body, "Synced" pill, primary + outline buttons                                                                                    | `tasks/[id]/submit` (success state)  | **Build as designed** with task copy: "Work submitted", task summary, a pill that follows the upload ("Uploading 45%", "Queued · uploads when online", "Synced"), buttons "View task" / "Back to tasks". |
| `M 5.1 Team earnings table`   | Chips row, date chip, gradient hero, data table                                                                                                                 | none                                 | Reference for the **filter chips** (task list) only.                                                                                                                                                     |
| `M 5.2 Member earnings table` | Two stat tiles, by-day table, info banner                                                                                                                       | none                                 | Out of v1.                                                                                                                                                                                               |
| `M 6.1 Sync center`           | Offline banner, queue card (Pending / Failed + Retry), conflict card, "Sync now"                                                                                | `(app)/sync` (upload queue)          | **Build as designed minus the conflict card.** Queue rows are upload-queue items; "Sync now" processes the queue.                                                                                        |
| `M 6.2 Profile`               | Avatar, name, role pill, info rows, Sync center and Change password rows, Sign out                                                                              | `(app)/profile`                      | **Adapted.** The role stays the designed pill; rows become Employee ID, Phone, App version, Pending uploads; "Sync center" row as designed; "Change password" dropped; Sign out as designed.             |
| `Header.png`                  | Transparent foreground layer of the auth header: white logo tile with teal needle mark, "StitchFlow" wordmark, title, subtitle                                  | none                                 | Reference only; the header is built in code. The mark inside it is a 22 px raster and cannot be used as an asset (§10).                                                                                  |

### 1.1 Screens the brief needs that are not designed

Composed from the inventoried components so they look native to the file. Each is a plain recipe for phases 7 and 8; differences from the designs are listed again after each screen is built.

- **Task list** `(app)/index`. Root `Header` (title "My tasks", subtitle = today's date, right slot `SyncStatusPill`). Under it the `NetworkBanner` when offline. A horizontal row of `Chip`s: All, Assigned, Accepted, Submitted, Reviewed (the 38 px chips of M 5.1). Then a FlashList of `TaskCard`s on the slate-50 page: white card, radius 16, slate-200 border, padding 16; title 16/700 slate-900; meta line 13/400 slate-500 (customer · location · order number); a `StatusPill` top-right; a bottom row with target progress ("120 / 150 pcs", 13/600) and the due date, an amber "Overdue" caption when late, and a small "Uploading…" or "Upload failed" pill when a queue item exists for the task. Pull-to-refresh. `EmptyState` ("No tasks for today"), `ErrorState` with retry, `Loader`.
- **Task detail** `tasks/[id]`. Back `Header` (title = service, subtitle = garment). Scroll content: a `StatusBanner` row (status pill + due date), an `InfoRows` card (Customer, Location, Order, Style · colour · size, Assigned, Accepted at), two `StatTile`s like the M 4.3 summary tiles (Target, Completed, with accepted after review), the latest submission `Card` (52 px thumbnail via expo-image, note, submitted time) and, once reviewed, a `Banner.success` or `Banner.warning` with the review note and "accepted X of Y". Bottom-fixed 56 px `Button` "Accept task" or "Complete task".
- **Capture** `tasks/[id]/capture`. Full-bleed `CameraView` on slate-900, a top bar (slate-900 at 60 %) with a 40 px circular back button (white 16 %), the task title and a framing hint, and a bottom bar with a 72 px shutter ring (white, 4 px) and its caption. Light status-bar content while the viewfinder shows. Permission states are `EmptyState`s: not asked, or denied while the system can still ask → explanation + "Allow camera"; denied for good → explanation + "Open settings". After the shot: the M 4.2 layout (title 17/700, description 13/18, the photo in the 350 × 250 frame) with "Retake" (48 px outline) and "Use photo" (48 px primary) side by side.
- **Submit** `tasks/[id]/submit`. Back `Header` ("Submit work", subtitle task, sync pill). In M 4.3's order: the summary tiles card (Target, Due), a form `Card` in place of the member table with "Completed pieces" (required) and "Accepted pieces (optional)" as 56 px numeric `TextField`s with the count-input value style (18/700 teal-700, right-aligned) and "Note (optional)" as a multiline `TextField` with a 500-character counter, then the attached-photo card (52 px thumbnail, 14/700 title, 12/400 subtitle, "Change"). A `Banner.info` "Saved on this device first. It uploads automatically when online." (amber with the cloud-off icon while offline). Bottom-fixed 56 px `Button` "Submit work" with the send icon. After submitting, the same route shows the M 4.4 success state; back and swipe-back are blocked there, and Android back opens the task.

---

## 2. Conflicts and decisions

Resolved on 2026-10-22 (recorded in `../mobile/docs/API_CONTRACT.md` and the session memory): employee flow, Figma as design system, phone login, backend submit fields, REVIEWED final, camera only, success screen only, Inter bundled via expo-font, expo-linear-gradient for gradients.

Still open, decided by default unless you say otherwise:

1. **Navigation shell.** The designs use a bottom tab bar; the brief lists a stack. Proposed: a two-tab bar (**Tasks**, **Profile**) in the designed style (84 px bar, teal-100 active pill, Feather icons), with task detail, capture, submit (whose success state is M 4.4) and the sync center stacked above it without the bar. The brief's route files stay as listed, with `index.tsx` and `profile.tsx` inside a `(tabs)` group under `(app)`.
2. **"Forgot password?"** is omitted from the login sheet rather than shown dead. The footer note "Accounts are created by your admin. No sign-up." stays.
3. **Card gap** measures 14 px in the file; the token scale is in steps of 4, so cards use 16. Accepted 2 px deviation.

---

## 3. Colors

### 3.1 Palette as measured

| Hex                                                         | Tailwind name                          | Seen on                                                                                                                            |
| ----------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `#FFFFFF`                                                   | white                                  | cards, headers, tab bar, inputs, auth sheet, text on primary, logo tile                                                            |
| `#F8FAFC`                                                   | slate-50                               | app page background, table header rows, conflict version tiles                                                                     |
| `#F1F5F9`                                                   | slate-100                              | back-button circle                                                                                                                 |
| `#E2E8F0`                                                   | slate-200                              | card and tile borders, list separators, header and tab-bar hairlines, photo placeholder fill, "or" divider, empty strength segment |
| `#CBD5E1`                                                   | slate-300                              | input, search, count-input, chip and outline-button borders                                                                        |
| `#94A3B8`                                                   | slate-400                              | placeholders, input icons, chevrons, footer note, placeholder icon                                                                 |
| `#64748B`                                                   | slate-500                              | secondary text, KPI labels, table headers, inactive tab labels, info-row labels                                                    |
| `#475569`                                                   | slate-600                              | inactive chip text, settings-row icons                                                                                             |
| `#334155`                                                   | slate-700                              | form labels, table body, queue row text, back arrow, neutral outline-button text                                                   |
| `#0F172A`                                                   | slate-900                              | primary text, OTP digits, password dots                                                                                            |
| `#F0FDFA`                                                   | teal-50                                | summary tiles, table total rows, "Completed" tile                                                                                  |
| `#CCFBF1`                                                   | teal-100                               | avatars, active-tab pill, role pill, icon tile, **auth subtitle text on the gradient**                                             |
| `#99F6E4`                                                   | teal-200                               | small labels on gradient hero cards                                                                                                |
| `#0F766E`                                                   | teal-700                               | **primary**: buttons, links, active chip, focus border, KPI numbers, stepper done/active, logo mark, gradient start                |
| `#115E59`                                                   | teal-800                               | text on teal-50 / teal-100 (pills, totals)                                                                                         |
| `#134E4A`                                                   | teal-900                               | gradient end                                                                                                                       |
| `#F0FDF4` `#DCFCE7` `#BBF7D0` `#16A34A` `#15803D` `#166534` | green 50 / 100 / 200 / 600 / 700 / 800 | success surface / success ring / banner border / disc, check, strength bars / pill text and dot / banner text                      |
| `#FFFBEB` `#FDE68A` `#D97706` `#B45309` `#92400E`           | amber 50 / 200 / 600 / 700 / 800       | warning surface / banner border / "Rework" number / pill text, dot and banner icon / banner title                                  |
| `#FEF2F2` `#FECACA` `#FCA5A5` `#DC2626` `#B91C1C`           | red 50 / 200 / 300 / 600 / 700         | danger surface / alert border / conflict border / icon, sign-out text, "Failed" dot / alert text                                   |
| `#EFF6FF` `#BFDBFE` `#2563EB` `#1E40AF`                     | blue 50 / 200 / 600 / 800              | info surface / border / icon / text                                                                                                |
| `rgba(255,255,255,0.16)`                                    | white 16 %                             | round icon button on the gradient (reads as `#368781` over teal)                                                                   |

Gradient: linear from `#0F766E` at the top-left to `#134E4A` at the bottom-right, about 130°, two stops (sampled corners of the login header: `#0F766E`, `#11625C`, `#106E67`, `#125A55`).

### 3.2 Semantic tokens for `shared/theme/colors.ts`

The brief's tokens first, then what the designs additionally need. Everything is marked `// TODO: verify from Figma`.

| Token                                                                           | Value                                                     | Notes                                          |
| ------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------- |
| `primary`                                                                       | `#0F766E`                                                 |                                                |
| `primaryPressed`                                                                | `#115E59`                                                 | not designed; proposal                         |
| `primaryText`                                                                   | `#FFFFFF`                                                 | text and icons on primary                      |
| `primarySubtle`                                                                 | `#CCFBF1`                                                 | avatars, active tab pill, brand pills          |
| `primarySurface`                                                                | `#F0FDFA`                                                 | tinted tiles, total rows                       |
| `primaryStrong`                                                                 | `#115E59`                                                 | text on the two tints above                    |
| `gradientStart` / `gradientEnd`                                                 | `#0F766E` / `#134E4A`                                     | auth header, hero cards                        |
| `onPrimaryMuted` / `onPrimarySubtle`                                            | `#CCFBF1` / `#99F6E4`                                     | text on the gradient                           |
| `overlayOnPrimary`                                                              | `rgba(255,255,255,0.16)`                                  | icon buttons on gradient or camera             |
| `background`                                                                    | `#F8FAFC`                                                 | app pages; auth uses `surface` for the sheet   |
| `surface`                                                                       | `#FFFFFF`                                                 |                                                |
| `surfaceMuted` / `surfaceSunken`                                                | `#F1F5F9` / `#E2E8F0`                                     | back button circle / photo placeholder         |
| `textPrimary`                                                                   | `#0F172A`                                                 |                                                |
| `textBody`                                                                      | `#334155`                                                 | labels, table body                             |
| `textSecondary`                                                                 | `#64748B`                                                 |                                                |
| `textMuted`                                                                     | `#475569`                                                 | inactive chips, row icons                      |
| `textPlaceholder`                                                               | `#94A3B8`                                                 |                                                |
| `border`                                                                        | `#E2E8F0`                                                 | cards, separators, hairlines                   |
| `borderStrong`                                                                  | `#CBD5E1`                                                 | inputs, chips, outline buttons                 |
| `borderFocus`                                                                   | `#0F766E`                                                 | 2 px                                           |
| `success` / `successText` / `successSurface` / `successBorder` / `successRing`  | `#16A34A` / `#15803D` / `#F0FDF4` / `#BBF7D0` / `#DCFCE7` |                                                |
| `warning` / `warningText` / `warningSurface` / `warningBorder` / `warningTitle` | `#D97706` / `#B45309` / `#FFFBEB` / `#FDE68A` / `#92400E` |                                                |
| `danger` / `dangerText` / `dangerSurface` / `dangerBorder`                      | `#DC2626` / `#B91C1C` / `#FEF2F2` / `#FECACA`             |                                                |
| `info` / `infoText` / `infoSurface` / `infoBorder`                              | `#2563EB` / `#1E40AF` / `#EFF6FF` / `#BFDBFE`             |                                                |
| `disabled` / `disabledText`                                                     | `#E2E8F0` / `#94A3B8`                                     | not designed; proposal                         |
| `cameraOverlay`                                                                 | `rgba(15,23,42,0.6)`                                      | not designed; proposal for the viewfinder bars |
| `cameraBackground`                                                              | `#0F172A`                                                 | not designed; behind the viewfinder            |

### 3.3 Status colors

Pills as designed use a 6 px dot for success / warning / danger and no dot for brand:

| Tone    | Surface   | Text / dot                | Designed labels                               |
| ------- | --------- | ------------------------- | --------------------------------------------- |
| success | `#F0FDF4` | `#15803D`                 | All synced, Synced, Submitted, Active         |
| warning | `#FFFBEB` | `#B45309`                 | Not submitted, Pending, Offline · N pending   |
| danger  | `#FEF2F2` | `#B91C1C` (dot `#DC2626`) | Failed                                        |
| info    | `#EFF6FF` | `#1E40AF`                 | not used as a pill in the file; banner colors |
| brand   | `#CCFBF1` | `#115E59`, no dot         | Employee, Supervisor, View table              |
| neutral | `#F1F5F9` | `#475569`                 | not designed; proposal                        |

`taskStatus` map (backend enum → tone, label):

| Status        | Tone    | Label       |
| ------------- | ------- | ----------- |
| `ASSIGNED`    | brand   | Assigned    |
| `ACCEPTED`    | info    | Accepted    |
| `IN_PROGRESS` | info    | In progress |
| `SUBMITTED`   | warning | Submitted   |
| `REVIEWED`    | success | Reviewed    |
| `CANCELLED`   | neutral | Cancelled   |

Local upload-queue overlay (shown instead of the task status while a queue item exists): `queued` / `uploading` → warning "Submitting" (the brief's word); `failed` → danger "Upload failed"; confirmed → the server status. Sync center rows: "Pending" (warning), "Waiting" while offline (warning), "Uploading" (info), "Failed" (danger). Tinted stat tiles (M 3.3): teal-50 / teal-700, green-50 / green-600, amber-50 / amber-600, red-50 / red-600.

---

## 4. Typography

- **Family: Inter** (the Google Fonts variable version Figma uses, v4 metrics). **Weights used: 400, 500, 600, 700.** No letter-spacing except possibly +0.2–0.5 on the uppercase 10 px table headers.
- **Loading proposal (approved):** bundle four static TTFs, `Inter-Regular`, `Inter-Medium`, `Inter-SemiBold`, `Inter-Bold`, from the Inter 4.x release (SIL Open Font License) in `assets/fonts/` through the `expo-font` config plugin. Fonts load at build time, so there is no splash delay and no runtime `useFonts`. On Android custom fonts do not synthesise weights, so `typography.ts` maps each weight to its own family name.

| Size | Line height                     | Weights seen                                                                                      | Used for                                                        |
| ---- | ------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 28   | 34                              | 700                                                                                               | auth titles, earnings amount, profile initials                  |
| 22   | 28                              | 700                                                                                               | success title, profile name, KPI values, detail avatar initials |
| 20   | 26                              | 700                                                                                               | screen header titles, member name                               |
| 18   | 24                              | 700                                                                                               | wordmark, card titles, count-input values, amounts              |
| 17   | 24                              | 700                                                                                               | user name in the home header, section titles                    |
| 16   | 22                              | 400 inputs · 600 buttons · 700 section and card titles                                            |                                                                 |
| 15   | 22                              | 400 auth subtitle · 600 list names, settings rows, "+94"                                          |                                                                 |
| 14   | 20                              | 400 body · 600 links, compact buttons · 700 small titles                                          |                                                                 |
| 13   | 16 (labels, alerts) · 18 (body) | 400 small body, table cells · 500 labels, alerts · 600 chips, outline buttons · 700 small amounts | The two-line alert in M 1.3 has a 16 px line pitch              |
| 12   | 16                              | 400 captions, header subtitles · 500 banner body, helper text · 600 badges                        |                                                                 |
| 11   | 14                              | 400/500 KPI labels, tab labels, step labels, employee IDs · 600 active tab                        |                                                                 |
| 10   | 12                              | 600 UPPERCASE table headers · 400 tile labels                                                     |                                                                 |

`AppText` variants for `typography.ts` (the brief's five plus what the file needs): `display` 28/34 700, `title` 20/26 700, `heading` 17/24 700, `subtitle` 15/22 400, `body` 14/20 400, `bodySmall` 13/18 400 (the M 4.2 description), `label` 13/16 500, `caption` 12/16 400, `micro` 11/14 500, `overline` 10/12 600 uppercase, `button` 16/22 600. A `weight` prop covers one-off weights. Sizes go through `moderateScale(size, 0.3)`; `maxFontSizeMultiplier` is 1.3.

---

## 5. Spacing and layout

| Metric                               | Measured                                                                                               | Token                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------- |
| Screen side padding, app screens     | 20                                                                                                     | `xl` 20                   |
| Screen side padding, auth sheet      | 24                                                                                                     | `xxl` 24                  |
| Content top padding under the header | 16                                                                                                     | `lg` 16                   |
| Card padding                         | 16 inside a 1 px border; hero 18                                                                       | `lg` 16                   |
| Gap between stacked cards / sections | 14–16                                                                                                  | `lg` 16 (see §2.3)        |
| Gap between tiles                    | 10 (3-up), 8 (4-up)                                                                                    | `sm` 8 / `md` 12          |
| Label → input                        | 6 between the label line box and the field (≈8 glyph to field)                                         | `xs` + `xxs` 6            |
| Field → next label                   | 16                                                                                                     | `lg` 16                   |
| Buttons side by side                 | 10                                                                                                     | `md` 12                   |
| App header                           | 64 + status bar (Home 68), 1 px bottom hairline                                                        | layout token              |
| Tab bar                              | 50 + bottom inset (84 on this frame), 1 px top hairline                                                | layout token              |
| Bottom CTA                           | 56 high, 16 above the tab bar or safe area                                                             | layout token              |
| Auth header                          | 16 below the status bar; 8 between brand row or back button, title and subtitle; 28 to the sheet       | `lg`, `sm`, `xxl` + `xs`  |
| Auth sheet                           | 28 top padding (first element at y = 228), 24 sides; groups 16 apart (measured ≈18)                    | `xxl` + `xs`, `xxl`, `lg` |
| Rows                                 | list 64 · info rows 41 (first 45) · table rows 49 · table header 38 · settings rows 54 · queue rows 55 | size tokens               |

Spacing scale in steps of 4: `xxs` 2, `xs` 4, `sm` 8, `md` 12, `lg` 16, `xl` 20, `xxl` 24, `xxxl` 32, `huge` 40.

---

## 6. Radius

| Measured | Where                                                                                   | Token      |
| -------- | --------------------------------------------------------------------------------------- | ---------- |
| 3        | strength segments                                                                       | `xs` 4     |
| 10       | alert box, compact card buttons, version tiles, photo thumbnail, logo tile              | `sm` 10    |
| 12       | inputs, search, OTP cells, count inputs, banners, icon tile, 48 px buttons, small tiles | `md` 12    |
| 14       | 56 px buttons, KPI tiles, offline card, settings rows                                   | `lg` 14    |
| 16       | cards, photo placeholder, earnings hero (home hero 18)                                  | `xl` 16    |
| 28       | auth sheet top corners                                                                  | `sheet` 28 |
| full     | pills, badges, chips, avatars, icon buttons, stepper circles, shutter                   | `full` 999 |

---

## 7. Component sizes

- **Buttons:** 56 high / radius 14 (primary, outline, soft-danger, inverse); 48 high / radius 12 ("Retake", "Use photo", in-card CTA); 42 high / radius 10 (conflict card). Chips 38 high, full radius, 16 px horizontal padding. Outline border 1 px slate-300.
- **Inputs:** 56 high, radius 12, 1 px slate-300, 16 px horizontal padding, 20 px leading icon in slate-400, 12 from icon to text; **focus = 2 px teal-700**. The +94 prefix divider is 1 × 18 in slate-200. Search 44 high. Count input 96 × 46, slate-300 border, value 18/700 teal-700 centred. OTP cells 48 × 60.
- **Avatars** (initials 700 teal-700 on teal-100): 40 in lists, 44 in the home header, 68 on member details, 84 on profile.
- **Icon button:** 40 circle, slate-100 with slate-700 icon, or white 16 % with white icon on the gradient.
- **Badge / pill:** 22–23 high, 10 px horizontal padding, 6 px dot, 6 px gap, text 12/600.
- **Sync pill:** same as badge, 93 wide for "All synced".
- **Stepper:** 22 px circles, 2 px connectors.
- **Active-tab pill:** 52 × 30; tab icons 24; labels 11/500 (active 600).
- **Icon tile:** 40 × 40, radius 12, teal-100.
- **KPI tile:** 110 × 68 outlined (Home); 82 × 48 tinted (details); summary tile 156 × 59 tinted (review).
- **Success mark:** 84 ring green-100, 56 disc green-600, 32 white check.
- **Photo placeholder:** 350 × 250 (aspect 1.4), radius 16, slate-200 fill, 44 px image icon and filename in slate-500; thumbnail 52, radius 10.
- **Logo tile:** 36 × 36 white, radius 10, mark about 22 px in teal-700.
- **Alert box:** minimum 44 high (one line; two lines are 58), 12 padding, radius 10, red-50 fill, 1 px red-200 border, 20 px icon centred, 10 from icon to text, text 13/16 500.
- **Banner:** radius 12, 1 px border, 16 px padding, 20 px icon, body 12/500 (title 13/600 when present).

---

## 8. Icons

Lucide-style outlines with a 2 px stroke. **Feather** in `@expo/vector-icons` is the closest family (Lucide forked Feather). The only glyph without a Feather match is the banknote, which v1 does not need.

| Design icon                  | Where in v1                                | `@expo/vector-icons`                            |
| ---------------------------- | ------------------------------------------ | ----------------------------------------------- |
| list / clipboard             | Tab "Tasks"                                | Feather `clipboard` (not in the file; proposal) |
| user                         | Tab "Profile"                              | Feather `user`                                  |
| arrow-left                   | back buttons                               | Feather `arrow-left`                            |
| chevron-right / chevron-down | rows, country code                         | Feather `chevron-right` / `chevron-down`        |
| lock                         | password field                             | Feather `lock`                                  |
| eye / eye-off                | show password                              | Feather `eye` / `eye-off`                       |
| alert-circle                 | error alert, failed state                  | Feather `alert-circle`                          |
| info                         | info banners                               | Feather `info`                                  |
| map-pin                      | task location                              | Feather `map-pin`                               |
| camera / image               | capture, placeholder                       | Feather `camera` / `image`                      |
| check                        | stepper done, success banner, success mark | Feather `check`                                 |
| send                         | "Submit work"                              | Feather `send`                                  |
| refresh-cw                   | "Sync now", retry, sync center row         | Feather `refresh-cw`                            |
| cloud-off                    | offline banner                             | Feather `cloud-off`                             |
| calendar                     | due date                                   | Feather `calendar`                              |
| log-out                      | sign out                                   | Feather `log-out`                               |
| search                       | not in v1                                  | Feather `search`                                |
| settings / external-link     | "Open settings" (camera denied)            | Feather `settings` (proposal)                   |

Icon sizes: 14 `xs` (pin, calendar, small chevrons), 18 `sm` (chevron-right, info, image, check), 20 `md` (input icons, alert, button icons, row icons, back arrow), 24 `lg` (tab bar), 32 `xl` (success check), 44 `xxl` (photo placeholder), 72 `shutter` (not designed).

---

## 9. Reusable components

Mapped to the brief's `shared/ui` list, with the design variants and the screens that use them.

| Component (brief §11)    | Variants and states seen                                                                                                                                                                                                                                                                  | Screens                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `Screen`                 | app page (slate-50, safe area, optional scroll, optional bottom-fixed CTA slot); auth (gradient background + white sheet with radius 28 top corners)                                                                                                                                      | all                                  |
| `AppText`                | variants of §4; `weight`, `color` token props; `maxFontSizeMultiplier` 1.3                                                                                                                                                                                                                | all                                  |
| `Button`                 | `primary` (teal, white text), `outline` (white, slate-300 border, teal text), `secondary` (white, slate-300, slate-700 text), `danger` (red-50, red-600 text, no border), `inverse` (white on gradient); sizes 56 / 48 / 42; optional leading icon; loading and disabled are not designed | many                                 |
| `TextField`              | label 13/500 slate-700 above; 56 high; leading icon; trailing action (eye); placeholder slate-400; focus 2 px teal; multiline for notes; numeric for quantities. Inline field errors are **not designed**: proposal = 1 px red-600 border + 12/500 red-700 helper text                    | login, submit                        |
| `FormTextField`          | `TextField` wrapped in a react-hook-form `Controller`                                                                                                                                                                                                                                     | login, submit                        |
| `PhonePrefix`            | 🇱🇰 `+94` prefix, chevron and 1 px divider, passed as a `TextField` prefix                                                                                                                                                                                                                 | login                                |
| `Card`                   | default (white, slate-200, radius 16, padding 16); pressable with chevron; danger outline (red-300)                                                                                                                                                                                       | many                                 |
| `Header`                 | root (title 20/700 + subtitle 12/400, right slot); back (40 px circle + title + subtitle); home (44 avatar + greeting); auth (gradient, logo tile or back button, 28/700 title, 15/400 teal-100 subtitle)                                                                                 | all                                  |
| `Badge` / `StatusPill`   | tones of §3.3, with or without dot                                                                                                                                                                                                                                                        | list, detail, sync, profile          |
| `SyncStatusPill`         | "All synced" (success) / "Offline · N pending" (warning) / "N pending" (warning)                                                                                                                                                                                                          | every app header                     |
| `Loader`                 | not designed; teal `ActivityIndicator`, inline or full-screen                                                                                                                                                                                                                             | list, buttons                        |
| `EmptyState`             | not designed; proposal = 40 px icon tile (teal-100, teal-700 icon), 17/700 title, 14/400 slate-500 body, optional button                                                                                                                                                                  | list, capture permissions            |
| `ErrorState`             | not designed; `EmptyState` with the alert icon in red tones and a "Try again" outline button                                                                                                                                                                                              | list, detail                         |
| `ConfirmDialog`          | not designed; proposal = centred white card radius 16, title 17/700, body 14/400, two 48 px buttons                                                                                                                                                                                       | logout with pending uploads          |
| `Divider`                | 1 px slate-200; with centred "or" label 12/400 slate-400                                                                                                                                                                                                                                  | login, lists                         |
| `Icon`                   | Feather wrapper with the size tokens of §8                                                                                                                                                                                                                                                | all                                  |
| `NetworkBanner`          | the M 6.1 amber banner ("You are offline", body) shown under the header when offline                                                                                                                                                                                                      | list, detail, submit                 |
| **Extras from the file** |                                                                                                                                                                                                                                                                                           |                                      |
| `Banner`                 | info / success / warning (with title) / danger; icon + text                                                                                                                                                                                                                               | detail, capture, submit, sync center |
| `Avatar`                 | initials; 40 / 44 / 68 / 84                                                                                                                                                                                                                                                               | profile                              |
| `InfoRows`               | label 13/400 slate-500 left, value 13/600 slate-900 right, 41 px rows, inset separators, inside a `Card` with 4 px inner padding                                                                                                                                                          | detail, profile                      |
| `StatTile`               | outlined (Home) / tinted (details, review); value 22/700 or 18/700, label 11/400                                                                                                                                                                                                          | detail, submit                       |
| `Chip`                   | active (teal fill, white text) / inactive (white, slate-300, slate-600 text); 38 high                                                                                                                                                                                                     | list filter                          |
| `TabBar`                 | two tabs, active pill 52 × 30 teal-100, icons 24, labels 11                                                                                                                                                                                                                               | shell (pending decision §2.1)        |
| `SuccessState`           | ring + disc + check, 22/700 title, 14/400 body, pill                                                                                                                                                                                                                                      | submitted                            |
| `SettingsRow`            | 54 px card row: 20 px slate-600 icon, 15/600 label, chevron                                                                                                                                                                                                                               | profile                              |
| `QueueRow`               | 55 px row: 14/400 slate-700 text, status pill, optional "Retry" 13/600 teal link                                                                                                                                                                                                          | sync center                          |
| `PhotoPreview`           | 350 × 250 frame with image, or a 12 px-padded card row: 52 px thumbnail, 14/700 title, 12/400 subtitle, "Change"                                                                                                                                                                          | capture, submit, detail              |
| `Stepper`                | done (check) / active (number) / upcoming; not needed in v1 but cheap if the two-step flow wants it                                                                                                                                                                                       | optional                             |
| `CountInput`             | folded into `TextField` numeric styling                                                                                                                                                                                                                                                   | submit                               |

Not built in v1: `HeroCard`, `DataTable`, `SearchField`, `OtpInput`, `PasswordStrength`, `ConflictCard`, `DateRangeChip`.

---

## 10. Assets to export from Figma into `mobile/assets/`

Nothing may be cropped out of the screenshots; the mark in `Header.png` is a 22 px raster and unusable.

1. **StitchFlow logo mark** (needle and thread), **SVG** preferred (`expo-image` renders SVG); otherwise PNG at 44, 88 and 132 px. It sits at about 22 px inside the 36 px white tile with radius 10.
2. **App icon:** 1024 × 1024 PNG, opaque, teal-700 background with the white tile and mark.
3. **Android adaptive icon:** 1024 × 1024 foreground with the mark inside the safe zone, a solid background colour (teal-700 or white), and a monochrome version.
4. **Splash:** the mark or tile as a PNG with a background colour (white, or teal-700 for continuity with the login header). The scaffold uses the Expo template's placeholder until these arrive.
5. **Inter TTFs** are downloaded in phase 4 from the Inter release, not exported from Figma.

The wordmark is live text (Inter 18/700) and the flag is the 🇱🇰 emoji; neither needs an asset. There are no illustrations: the success mark is three shapes plus an icon.

---

## 11. Not covered by the designs

- Pressed, disabled and loading states of buttons, chips and rows (proposal: pressed = `primaryPressed` fill or 8 % slate overlay; disabled = `disabled` fill with `disabledText`; loading = white spinner replacing the label).
- Inline field errors (proposal in §9), empty, error and loading screens, confirm dialog, toasts (proposal: white card, radius 12, 1 px border, 20 px tone icon, text 13/500, bottom-inset 16).
- The live camera viewfinder, shutter, and permission screens.
- Keyboard-open layouts; 360 dp phones and long-text overflow.
- App icon and splash.
- Dark mode: the file has no dark screens; nothing to ignore.

---

## 12. Expected differences from the PNGs, per v1 screen

Listed now so they are not surprises after the build; each screen is compared again with its PNG when built.

- **Login:** no "Forgot password?" link. Inline field errors on empty fields (not designed; the file only shows the top alert, which is kept for backend errors). Keyboard avoiding will shift the sheet.
- **Task list:** fully composed; nearest references are M 2.1 (header, pills) and M 3.1 (cards). The "Overdue" caption and upload indicator are new.
- **Task detail:** composed (§1.1). Phase 8 adds the sync pill to its header, an upload notice under the title, and "Retry upload" or "Take a new photo" when an upload failed.
- **Capture, compared with M 4.2 in phase 8:**
  - Gone: the stepper and the bottom call-to-action.
  - "Choose from gallery" becomes "Use photo", because the app is camera only.
  - The "saved on this device" banner moved to the submit screen, because the photo is only saved when the work is submitted.
  - The buttons sit 12 apart instead of the measured 10.
  - Title, description, frame and button sizes match.
- **Submit, compared with M 4.3 in phase 8:**
  - No stepper, and the counts form replaces the member table.
  - The tiles read Target and Due instead of Members and Total items.
  - Cards stack 16 apart, and the tiles card has 16 padding, instead of the measured 14 (§2.3).
  - The info banner is new.
  - The photo card matches: 12 padding, 52 px thumbnail, 14/700 title, 12/400 subtitle, 14/600 "Change".
- **Submitted, compared with M 4.4 in phase 8:**
  - Copy differs. The title is "Work submitted"; the body reads "task · n pcs" and "The tally sheet photo is attached."; the buttons are "View task" and "Back to tasks".
  - The pill follows the upload.
  - The mark, the 16 and 12 gaps, the type and the two 56 px buttons 14 apart match.
- **Sync center, compared with M 6.1 in phase 8:**
  - No conflict card.
  - The subtitle shows the last successful upload, or "Nothing uploaded yet".
  - Rows show the task title over "date · n completed" or the failure reason.
  - A failed row offers "Retry", or "Discard" with a confirmation when retrying cannot help.
  - "Sync now" is disabled offline and spins while uploading.
  - The "All caught up" empty state is new.
  - The banner, the 15/700 "Queue" title, the 55 px rows and the pills match.
- **Stacked screens:** capture, submit and the sync center hide the tab bar (§2.1). Their bottom buttons sit on the safe area instead of 16 above an 84 px bar, so they and the centred success block sit lower than in the PNGs.
- **Profile, compared with M 6.2 in phase 9:**
  - The rows are Employee ID, Phone, App version and Pending uploads, instead of Phone, Age, Gender, Teams and Sites.
  - The role stays the designed pill, so it is not repeated as a row.
  - No "Change password" row, because the backend has no flow for it.
  - The "Sync center" row sits 16 below the info card, where the PNG measures 14 (§2.3).
  - The title-only header is 48 tall, where the PNG measures 47.
  - The avatar, name, pill, the info card with 41 px rows, the 54 px settings row, and the soft-red "Sign out" 16 above the tab bar all match.
  - Sign-out with unsent work opens a confirmation, which is not designed.
- **Everywhere:** two tabs instead of five (pending §2.1); the sync pill wording depends on the queue, not on team submissions.

---

## 13. Changes from the previous inventory

Compared with `../figma-ui/DESIGN_INVENTORY.md` (2026-10-21), this session's pixel sampling confirms every color and every size listed there, with these corrections and additions:

- Count-input border is **slate-300** `#CBD5E1`, not slate-200.
- Password-strength gap measures 8 px, not 6 (out of scope anyway).
- Login inputs sit at 56 px with 1 px borders; the auth sheet top radius of 28 and the card radius of 16 were verified from corner anti-aliasing.
- The screen map, status map, component list and assets are re-scoped to the employee flow; the "conflicts" section is replaced by the decisions already taken plus the three open points in §2.
- `taskStatus` now follows the backend enum (`ASSIGNED`, `ACCEPTED`, `IN_PROGRESS`, `SUBMITTED`, `REVIEWED`, `CANCELLED`) and adds the local upload states.
