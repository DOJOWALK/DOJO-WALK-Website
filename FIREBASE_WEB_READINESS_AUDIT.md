## Executive Summary — Current Status (2026-10-19)

**Overall result: PARTIAL / PRODUCTION READINESS NOT VERIFIED.** Source-level review and static CI checks have passed, but live Firebase behavior and shared Firestore authorization remain unverified.

- **Target Firebase project:** `dojo-platform-b68a3`.
- **Latest report update:** Step 72. Current PR chain and CI evidence were reconciled; report changes are awaiting PR review/merge. The report-only PR #6 is merged into `main`; report content has been verified on `main`.
- **Customer login/profile integration PR #5:** merged successfully into `feature/website-customer-profile-firestore` (merge commit `80c3ecfc2e4acd9b2c1d15bb05d2e723fae0bf2f`). It is **not merged into `main`**.
- **Remaining draft PR chain:** PR #2 targets `main`; PR #3 targets the home-polish branch; PR #4 targets the customer-login branch. All three are still open drafts and must be reviewed in dependency order before promotion.
- **Static CI evidence:** run `39248019883` for the auth integration passed syntax, DOM/local-link and profile-load guard checks. This is not Firebase Emulator, live OTP, or browser end-to-end validation.
- **Known source-level risks:** Website draft rules only allow owner-scoped `users/{uid}` access and deny other collections; checked-in Partner rules have profile-field allowlist mismatches and explicitly deny booking creation. Neither file is verified as the rules currently deployed to Firebase.
- **Not verified:** deployed Firestore rules, Firebase Console Phone Auth/authorized domains, live SMS OTP, Firestore Emulator permission tests, browser E2E, and full Customer/Partner/Admin rules compatibility.
- **Deployment decision:** **DO NOT DEPLOY FIRESTORE RULES** from this branch. Do not use Website-only or Partner checked-in rules as a shared production ruleset.
- **Next required work:** review the remaining PR chain and code diffs; obtain the currently deployed rules export from the authorized project operator; agree the canonical shared schema; prepare a complete shared rules candidate; then run positive/negative Emulator tests and browser verification before any production change.

Missing paths or unsuccessful searches are evidence gaps, not proof that a file/configuration does not exist. No Firebase Console settings or production deployments were changed.
# Firebase Web Readiness Audit

**Audit scope:** `feature/website-customer-auth-profile-integration`  
**Purpose:** Read-only configuration and integration review; no Firebase console changes or deployments were made.

## Findings

- `firebase-config.js` exists and points to Firebase project `dojo-platform-b68a3`, matching the intended shared DOJO WALK project.
- The web auth module imports Firebase Web SDK `11.10.0`, initializes Firebase from `firebase-config.js`, and uses Firebase Phone Authentication with reCAPTCHA.
- The profile page uses the same config and reads/writes the signed-in user's `users/{uid}` document. It blocks saving until the initial profile read completes.
- `firebase.json` points the Firebase CLI to `firestore.rules`.
- No `.firebaserc` file was found on this branch. CLI deployments must therefore always specify and verify the intended project explicitly.
- The repository does not prove that Phone sign-in is enabled or that the deployed website's domain is listed under Firebase Authentication authorized domains. Those settings require verification in Firebase Console.
- The current draft `firestore.rules` only allows owner-scoped `users/{uid}` access and denies every other collection. Because Customer, Partner, Admin, and other DOJO WALK flows share this Firebase project, these draft rules must **not** be deployed as the production ruleset.
- The existing GitHub Actions workflow checks JavaScript syntax, required DOM IDs, local script references, and profile-load safety. It does not test live SMS delivery, Firebase Console configuration, deployed authorized domains, Firestore Emulator behavior, or browser end-to-end flows.

## Required checks before live testing

1. In Firebase Console, confirm project ID `dojo-platform-b68a3`.
2. Confirm **Authentication → Sign-in method → Phone** is enabled.
3. Confirm the exact deployed website hostname is present in **Authentication → Settings → Authorized domains**. Do not assume a preview or GitHub Pages domain is already authorized.
4. Use Firebase's test phone numbers for controlled development tests where available; do not repeatedly send real SMS during static validation.
5. Audit the currently deployed Firestore rules and the Customer, Partner, and Admin collection access needs before preparing one shared ruleset.
6. Run Firestore Emulator tests and a real browser test of sign-in, profile read, profile create/update, sign-out, and denied cross-user access.
7. Never deploy the draft rules in this branch until the shared rules audit, emulator tests, and owner review are complete.

## Status

**Configuration source review: PASS** — project ID matches the expected shared project and both web pages import the same config module.

**Production readiness: NOT VERIFIED** — Firebase Console settings, live OTP, emulator behavior, and browser E2E have not been tested. No deployment was performed.


## Cross-repository schema compatibility check (follow-up)

A read-only inspection of `dojoplatform2026/dojo-partner/firestore.rules` (blob SHA `7b02a8bfb4fe80ab04d72f59966e2e09c848ffd0`) found rules for these top-level collections: `admin_users`, `walkers`, `users`, `pets`, `addresses`, `bookings`, `walk_requests`, `walker_reviews`, `zones`, `customers`, `coupons`, `payments`, and `audit_logs`, plus nested walker/customer subcollections.

The partner repository's `users/{userId}` create allowlist currently includes `name`, `phoneNumber`, `email`, `role`, `dateOfBirth`, `dob`, `age`, `photoUrl`, `profileImage`, `createdAt`, `updatedAt`, `language`, and `notificationEnabled`. It does not allow `uid`, `gender`, or `profileCompleted` on create. The website profile code writes `uid`, `gender`, `dateOfBirth`, `age`, `phoneNumber`, `email`, `photoUrl`, `role`, `profileCompleted`, `createdAt`, and `updatedAt`. Therefore, **the website's current profile create payload is incompatible with the partner repository's checked-in draft rules** unless the schema/rules or website payload are reconciled.

The partner rules' update allowlist also does not include every website-managed field, so profile updates need a field-by-field compatibility review as well. This repository comparison does not prove that the partner rules are the currently deployed Firebase rules; the deployed rules must be exported from Firebase Console before any final decision.

The customer repository's root `firestore.rules` and `firebase.json` were not found at those paths on its default branch during this check; no conclusion is made about its complete rules setup. Admin repository rules could not be located at root paths in this check either. These are evidence gaps, not proof that no rules exist.

### Required resolution

- Decide the canonical `users/{uid}` schema for Customer, Partner, and Admin consumers.
- Prefer a backward-compatible change set: preserve existing profile fields and role protections, define optional/required fields explicitly, and ensure only the owner can update private profile fields.
- Add emulator tests for website profile create/update against the **complete shared ruleset**, plus existing partner and admin flows.
- Do not deploy either the website draft rules or the partner repository rules based on this repository comparison alone.


### Follow-up: customer app payload and CI verification

A source-level comparison was also performed against `dojoplatform2026/dojo-walk-customer/lib/features/profile/screens/name_setup_screen.dart` (default branch, blob SHA `30601d4c884e2a30ffc7a7bcd4a1e09d330c3bfa`).

The customer app's profile save payload contains `uid`, `name`, `gender`, `dateOfBirth` (Firestore Timestamp), `phoneNumber`, `photoUrl`, `role`, `profileCompleted`, `updatedAt`, and conditionally `createdAt`. It does not write `age` or `email` in this save path. The website payload writes `uid`, `name`, `gender` (may be empty), `dateOfBirth` (Timestamp), `age`, `phoneNumber`, `email`, `photoUrl`, `role`, `profileCompleted`, `updatedAt`, and conditionally `createdAt`.

Consequently, the website and Flutter customer app broadly overlap on the core profile fields, but the website adds `age` and `email`, and the website UI treats gender as optional while the Flutter screen requires it. Both write `uid` and `profileCompleted`, which are excluded by the inspected partner rules' `users/{userId}` create allowlist. The inspected partner rules' update allowlist also excludes `gender`, `phoneNumber`, `uid`, and `profileCompleted`. If those checked-in rules are deployed, they can reject profile create/update operations from either customer client.

The GitHub Actions run for audit commit `7329b74aef0e0d5ba625416769b4a1b37ba0bd41` completed successfully (run ID `39241323276`). Its job, “Syntax and DOM contract checks,” passed JavaScript syntax validation, profile module syntax checks, HTML/local-link/DOM selector validation, and profile-load safety checks. This is a static CI pass only; it is not a Firebase Emulator, live SMS, or browser end-to-end test.

### Compatibility decision still required

Do not silently remove fields from either client or loosen rules without a shared schema decision. The owner should confirm whether `gender` is optional or required and whether `age` is a stored field or derived from `dateOfBirth`. Then update the canonical shared rules and add emulator tests for both clients' create and update payloads before any deployment.


### Step 58: Shared schema inventory and evidence gaps

Read-only searches were run against the default branches of the Customer and Admin repositories for Firestore rules/configuration and profile access patterns. The Customer source confirms multiple flows read `users/{uid}` (profile screen, splash/auth checks, and booking profile validation), while `name_setup_screen.dart` writes the shared profile document. Searches did not return a root `firestore.rules` or `firebase.json` result in the Customer repo, nor a discoverable Firestore rules file in the Admin repo. Search-index absence is an evidence gap only; it does not prove the files or configuration are absent.

#### Provisional compatibility matrix (based only on checked-in source)

| Consumer | Observed profile path / fields | Rules evidence | Current conclusion |
|---|---|---|---|
| Website | `users/{uid}`; writes `uid`, `name`, `gender`, Timestamp `dateOfBirth`, `age`, `phoneNumber`, `email`, `photoUrl`, `role`, `profileCompleted`, timestamps | Website branch contains a draft owner-only rules file that denies other collections; not production-safe for the shared project | Payload known; must not deploy draft rules |
| Flutter Customer | `users/{uid}`; writes `uid`, `name`, `gender`, Timestamp `dateOfBirth`, `phoneNumber`, `photoUrl`, `role`, `profileCompleted`, timestamps | Customer root rules file not located during this search | Payload known; rules compatibility unverified |
| Partner | Reads/writes `users/{userId}` and other collections per checked-in `firestore.rules` | Checked-in rules allowlists exclude fields used by Website/Customer for profile create/update | Definite source-level mismatch if this rules file is the deployed ruleset; deployment status unknown |
| Admin | Admin-related paths and collections are represented in Partner's checked-in rules, including `admin_users`, `customers`, bookings, service/zones-related data; Admin repository rules file was not located in this search | No verified complete Admin ruleset in this audit | Need source/rules discovery and deployed rules export before compatibility can be asserted |

#### No deployment decision yet

The complete shared ruleset cannot safely be reconstructed from the partial evidence. In particular, the checked-in Partner rules explicitly deny booking creation and deny all `walk_requests` reads/writes, so treating that file alone as the final shared production ruleset could break customer booking and other flows. Before any rules change, retrieve the currently deployed rules, inventory every collection used by Customer/Partner/Admin, and run Emulator tests for allowed owner access, cross-user denial, profile create/update, pet/address access, booking creation/cancellation, walker operations, admin operations, and service-location management.

**Step 58 status:** source inventory expanded; no app code, Firestore rules, Firebase Console settings, or deployment changed.


### Step 59: Customer collections and booking-rule compatibility

Additional read-only source checks:
- Customer dog screen uses `users/{uid}/pets`.
- Customer address service uses `users/{uid}/addresses`; it creates/merges address documents and may batch-update multiple documents when changing the default address. The checked-in Partner rules use an address allowlist with `pincode`; confirm the model's serialized field names against it.
- Customer booking confirmation (blob `94d45b12c7873fc2d289e164df965c735c0c63cb`) writes a top-level `bookings/{bookingId}` document with `customerId`, `bookingId`, `bookingPlan`, `serviceType`, `dogId`, `petDetails`, `pickupAddressId`, `pickupAddress`, `scheduledAt`, `walkCount`, `walkSchedules`, `status: pending`, `walkerId: null`, `cancelRequest: null`, and a server `createdAt` timestamp; regular/custom bookings add schedule fields.
- Checked-in Partner rules blob `7b02a8bfb4fe80ab04d72f59966e2e09c848ffd0` explicitly says `allow create: if false` for `bookings`. If deployed, this rejects the Customer booking writer. Deployment status remains unknown.
- Partner rules deny all `walk_requests` access; production use is not established.
- Admin code searches for service-location collections and booking references returned no indexed results in this pass. This is an evidence gap, not proof those collections/files are absent.

| Path | Evidence / compatibility status |
|---|---|
| `users/{uid}` | Website/Flutter payload mismatch risk remains: Partner allowlists omit `uid`, `gender`, and `profileCompleted`. |
| `users/{uid}/pets/{petId}` | Owner-scoped CRUD exists in checked-in Partner rules; validate actual pet payload and timestamps in Emulator. |
| `users/{uid}/addresses/{addressId}` | Owner-scoped CRUD exists; verify `pincode` versus serialized field naming and batch default-address updates. |
| `bookings/{bookingId}` | Critical mismatch if Partner rules are deployed: Customer creates bookings, checked-in rules deny all creates. |
| `walkers`, nested walker collections, `admin_users`, `customers`, `coupons`, `payments`, `walker_reviews`, `zones`, `audit_logs` | Partner rules have distinct permissions; full Admin and cross-app operation matrix remains incomplete. |
| `service_countries`, `service_states`, `service_cities`, `service_areas`, `service_localities`, indexes/imports | Rules and actual usage not verified in this pass. |

#### Step 59 conclusion
Do not deploy either repository's checked-in rules based on this audit. First export the currently deployed rules for the confirmed Firebase project `dojo-platform-b68a3`; reconcile profile, pet, address, booking, walker, admin and service-location operations; then test owner access, cross-user denial, profile CRUD, pet/address CRUD and batch updates, booking creation/cancellation, assigned-walker updates, and admin operations in the Firestore Emulator.

**Step 59 status:** collection inventory expanded; booking-create incompatibility identified from source. No app code, rules, Firebase Console settings, merges, or deployments changed.


### Step 60: Rules provenance check and deployment-safety gate

Fetched and compared the exact checked-in files again:
- Partner `firestore.rules`, blob `7b02a8bfb4fe80ab04d72f59966e2e09c848ffd0`.
- Website branch `firestore.rules`, blob `1e94b14ec855dd0450d30b735b02859be13b3331`.
- Website branch `firebase.json`, blob `0207c3fc808f51c418117f7e1facf13cf1a32b71`.

#### Findings confirmed from repository source

1. Website `firebase.json` points the CLI at `firestore.rules`, but does not identify a Firebase project. No `.firebaserc` was found in this branch in the earlier audit. A deployment command must not rely on an implicit/default project.
2. Website draft rules allow only owner access to `users/{uid}` and deny all other document paths. They are not a safe shared production ruleset for Customer, Partner and Admin.
3. Partner checked-in rules include an explicit booking-create denial and a user-profile field allowlist that excludes fields used by the Website and Flutter Customer profile writers. These are checked-in source findings only.
4. The repository files do not establish which rules version is currently deployed to Firebase project `dojo-platform-b68a3`. No Firebase Console/deployed-rules export was available in this GitHub source check. **Deployed rules status remains UNKNOWN, not PASS and not FAIL.**

#### Step 60 deployment-safety gate

| Gate | Result |
|---|---|
| Checked-in website rules identified | PASS |
| Checked-in partner rules identified | PASS |
| Intended project ID known from website config | PASS (source only) |
| Currently deployed Firestore rules retrieved | BLOCKED / NOT VERIFIED |
| Full shared schema agreed | NOT COMPLETE |
| Firestore Emulator rules tests run | NOT RUN |
| Safe to deploy a rules change | NO |

No rules were changed or deployed. Do not run `firebase deploy --only firestore:rules` from either repository as a workaround. The next safe action is for an authorized project operator to export/copy the active rules for the confirmed project, then run emulator tests against a reconciled shared ruleset. Never share service-account keys or private credentials in chat.

**Step 60 status:** source-level deployment-safety gate documented; live Firebase rules remain unverified because repository access cannot prove deployed configuration.



### Step 61: Firestore Emulator test plan (plan only; tests not run)

This step records the required test matrix and setup gaps before any shared Firestore rules are changed. It does **not** introduce a replacement ruleset, alter application payloads, start an Emulator, or deploy anything.

#### Repository setup inspection

- The branch's `firebase.json` (blob SHA `0207c3fc808f51c418117f7e1facf13cf1a32b71`) currently configures only `firestore.rules`; it has no checked-in Firestore Emulator port or emulator-specific configuration.
- The branch's `firestore.rules` (blob SHA `1e94b14ec855dd0450d30b735b02859be13b3331`) is the website-only draft that denies every collection except owner-scoped `users/{uid}`. It is **not** a valid basis for testing the complete shared production flows.
- This inspection did not establish a working Node test harness or a complete shared rules fixture. Before test implementation, inspect the repository file tree and any existing package/CI configuration directly; do not assume a test runner or add duplicate setup blindly.

#### Required test matrix

Tests must run against a separately reviewed, complete shared rules candidate in the Firestore Emulator—not against production and not against the current website-only draft as if it were the shared ruleset.

| Area | Allowed test cases | Denial / invalid test cases |
|---|---|---|
| Profile `users/{uid}` | Signed-in owner reads their profile; Website create/update payload; Flutter Customer create/update payload; server timestamps accepted where expected; preserve existing unknown/shared fields during allowed updates | Signed-out read/write; user A reads or writes user B's profile; forged `uid`; role escalation; invalid/missing required fields; client rewrites immutable `createdAt`; invalid `updatedAt`; out-of-policy field changes |
| Pets `users/{uid}/pets/{petId}` | Owner CRUD with the actual serialized pet model and allowed optional fields | Cross-user CRUD; signed-out access; malformed values; unexpected protected fields |
| Addresses `users/{uid}/addresses/{addressId}` | Owner CRUD with exact serialized field names; create/update default address; multi-document batch that clears old default and sets new default | Cross-user access; invalid address values; batch where any unauthorized document is touched; multiple defaults if the agreed model forbids them |
| Booking `bookings/{bookingId}` | Customer creates the observed pending booking payload; owner reads own booking; valid cancellation-request transition; timestamps and optional regular/custom schedule fields | Signed-out create/read; customer spoofs another `customerId`; invalid status or protected assignment fields; customer changes walker assignment or walk progress; cross-customer read/update |
| Walker operations | Assigned walker reads the booking and makes only permitted walk-state/progress updates; route/progress data follows agreed schema | Unassigned walker updates booking; walker changes customer, price, booking schedule, or assignment; one walker accesses another walker's restricted data |
| `walk_requests` | Test the explicitly approved product decision once its use is confirmed | Deny all reads/writes if the collection remains intentionally disabled; do not accidentally break a live flow without first confirming its intended status |
| Admin and operations | Authorized active admin performs approved booking, user-support, coupon, zone/service-location, and audit operations according to role | Non-admin or inactive admin cannot perform admin writes; ordinary users cannot edit `admin_users`, payments, audit logs, service locations, zones, or other privileged records |
| Shared collections | Verify explicit permissions for `walkers`, `walker_reviews`, `customers`, `coupons`, `payments`, `audit_logs`, `zones`, and service-location collections (`service_countries`, `service_states`, `service_cities`, `service_areas`, `service_localities`, import/index collections) | Default deny for every undocumented operation; no catch-all permission accidentally grants access |

#### Test implementation requirements

1. Obtain and review an export/copy of the **currently deployed** rules for Firebase project `dojo-platform-b68a3`; confirm provenance and date with the authorized project operator.
2. Agree the canonical shared schema and role/ownership transitions across Customer, Partner, and Admin. Confirm whether `gender` is required, whether `age` is stored or derived, and exact address/pet serialization names.
3. Add or reuse an isolated Emulator configuration and a test harness only after inspecting the full branch tree. Pin compatible Firebase CLI, `@firebase/rules-unit-testing`, and Firebase SDK versions in the repository's chosen package manager.
4. Load the reviewed candidate rules into the Emulator. Seed fixtures using test-only setup that bypasses rules; never use production customer records.
5. Implement positive and negative assertions from the matrix, including two distinct customer identities, two walker identities, an authorized admin, an inactive admin, and unauthenticated requests.
6. Include regressions for website and Flutter profile payloads, pet/address CRUD, default-address batch writes, booking create/read/cancel, assigned-walker-only changes, and admin-only writes.
7. Run the tests and report the exact command, counts, failures, and CI run URL. A successful syntax check is not an Emulator test.
8. Keep production deployment blocked until all required tests pass, an owner reviews the full diff, and the authorized operator separately verifies the target project and planned deployment.

#### Step 61 status

- Emulator test plan documented: **PASS**
- Emulator configuration and test harness verified: **NOT VERIFIED**
- Emulator tests executed: **NOT RUN**
- Canonical shared rules/schema approved: **NOT COMPLETE**
- Production rules deployed: **NO**
- Deployment authorization gate: **BLOCKED**

No rules, Firebase Console settings, app payloads, branches other than this audit branch, merges, or deployments were changed in this step.


### Step 62: Test-harness and CI setup inspection

Inspected known paths directly on `feature/website-customer-auth-profile-integration` and verified the existing Firebase configuration and browser auth module.

#### Findings

- `firebase.json` currently contains only the Firestore rules path; it has no `emulators.firestore` settings and no test-specific configuration.
- The expected root `package.json`, `package-lock.json`, and several guessed workflow paths (`.github/workflows/ci.yml`, `.github/workflows/website-checks.yml`, `.github/workflows/validate.yml`) returned 404 on this branch. This does not establish that no workflow exists under another filename or directory.
- `customer-auth.js` imports Firebase Web SDK modules from the pinned CDN version `11.10.0` and initializes Auth from `firebase-config.js`. This is browser ESM source, not a Node test harness.
- `firebase-config.js` identifies `dojo-platform-b68a3`; this is public web-client configuration, not evidence of current deployed rules or Console settings.
- The website-only draft `firestore.rules` remains unsuitable for the shared test suite because it denies every collection except `users/{uid}`.

#### Step 62 decision

Do **not** append Emulator settings to the existing `firebase.json` or add a guessed Node dependency file yet. The repository tree/workflow inventory is incomplete, and a safe test requires a separately reviewed shared rules fixture—not the current website-only rules. First obtain a complete file-tree listing for this branch and inspect the actual CI workflow; then choose a non-conflicting test location and package manager. Keep production and live Firebase untouched.

| Gate | Result |
|---|---|
| Existing Firebase CLI config inspected | PASS |
| Root Node package/test harness verified | NOT FOUND at checked paths |
| CI workflow identified by exact path | NOT VERIFIED |
| Firestore Emulator configured | NO |
| Shared rules fixture approved | NO |
| Emulator tests executed | NOT RUN |
| Production changes made | NO |

No application code, Firestore rules, Firebase Console settings, merges, or deployments were changed in Step 62.


### Step 63: Existing CI run and verification scope

The GitHub Actions run associated with audit commit `8907d8be755247a54775729bddf57aa237e6f197` was inspected. Run **39245116423** (“Customer auth integration checks”, run 10) completed with conclusion **success**. Its job “Syntax and DOM contract checks” passed these steps:

- External auth module syntax check
- Extracted profile module syntax check
- Profile module syntax validation
- HTML, local links, and DOM selector validation

This confirms the existing static validation pipeline is active for this commit. It does **not** reveal a Firestore Emulator test step; the observed job steps do not include Emulator setup, rules-unit-testing, database seeding, authorization assertions, live OTP, or browser end-to-end sign-in.

#### Step 63 conclusion

- Existing CI run located and job steps reviewed: **PASS**
- Existing static CI run: **PASS** (run 39245116423)
- Actual workflow file path fully inventoried: **NOT VERIFIED** (file search did not return an exact workflow path)
- Firestore Emulator step in observed job: **NOT PRESENT**
- Emulator tests executed: **NO**
- Production rules deployed: **NO**

Next safe action: obtain a complete branch tree/workflow file inventory, then add a separate Emulator test job and test-only shared rules fixture only after the canonical shared rules have been reviewed. Do not reinterpret the static CI pass as Firebase security-test success.

### Step 64: Repository-tree inventory attempt and safe test-job decision

The exact workflow path and complete file tree could not be established through the available GitHub file actions in this pass. The directory request for `.github/workflows` correctly returned a directory-not-a-file error; the following *candidate file paths* returned 404 on the audited branch: `.github/workflows/ci.yml`, `.github/workflows/website-checks.yml`, `.github/workflows/customer-auth.yml`, `.github/workflows/customer-auth-integration.yml`, and `.github/workflows/validate.yml`. Additional candidate paths on `main` (`.github/workflows/main.yml`, `test.yml`, `checks.yml`, `website.yml`, `deploy.yml`, and `firebase.yml`) and root `package.json`/`package-lock.json` also returned 404. These checks are not a complete tree listing and do **not** prove that no workflow or package manifest exists under another name or on another ref.

The GitHub code-search action returned no results for the workflow display name or its job title. That search is scoped to the repository's default branch, so it cannot by itself identify the workflow file responsible for the known run on the audit branch. The previously verified successful run (39245116423) remains evidence only for the static checks recorded in Step 63.

#### Step 64 decision

Do **not** create a guessed workflow file, introduce a second package manager, add Emulator configuration blindly, or test the current website-only rules as if they represented shared production rules. The safe next prerequisite is an actual recursive Git tree / directory listing for the exact audited branch (or the workflow file path from the successful run's metadata), followed by inspection of that workflow and a reviewed shared-rules candidate. The available GitHub actions exposed here do not provide a directory-list/tree endpoint, so this prerequisite remains blocked in this pass.

| Gate | Result |
|---|---|
| Candidate workflow paths checked on audited branch | PASS (checked; none matched) |
| Candidate workflow paths checked on `main` | PASS (checked; none matched) |
| Complete recursive branch tree obtained | BLOCKED / NOT AVAILABLE THROUGH CURRENT FILE ACTIONS |
| Exact workflow path identified | NOT VERIFIED |
| Existing static CI evidence preserved | PASS (Step 63; run 39245116423) |
| Emulator/test harness added | NO — intentionally not guessed |
| Shared rules candidate approved | NO |
| Emulator tests executed | NOT RUN |
| Production rules or Firebase Console changed | NO |
| Safe to deploy Firestore rules | NO — gate remains BLOCKED |

No application code, workflow, package manifest, Firestore rules, Firebase Console settings, merges, or deployments were changed in Step 64; only this audit report was updated.

### Step 65: Exact CI workflow located and static-vs-Firebase gate clarified

The exact workflow path was recovered from the changed-file list for PR #5 and then fetched directly from the audited integration branch:

- **Workflow:** `.github/workflows/customer-auth-integration-checks.yml`
- **Workflow blob SHA on the integration branch:** `f4f2532bd99104fc8093b2c0472fcc4f2d9399ff`
- **Trigger:** pull requests targeting `feature/website-customer-profile-firestore`, plus manual `workflow_dispatch`.
- **Job:** `customer-auth-static` / “Syntax and DOM contract checks”.
- **Checks present:** Node.js 22 syntax validation for `customer-auth.js`; extraction and syntax check of the inline profile module; duplicate HTML ID and local script checks; login DOM selector contract checks; profile-load safety guard checks.
- **Explicitly not covered:** Firebase Emulator, Firestore Rules authorization, SMS OTP, authorized domains, real browser E2E, and production-deployed rules.

This resolves the Step 64 workflow-path evidence gap for the known Customer Auth integration workflow. It does not establish a complete recursive repository-tree listing or a deployed Firebase rules snapshot.

The separate static website workflow run `39248139248` was also checked and completed successfully. Its job validates HTML links, local assets, and preview forms. This is a separate static check and does not cover Firebase permissions.

#### Step 65 gate

| Gate | Result |
|---|---|
| Exact Customer Auth workflow path identified | PASS |
| Workflow contents fetched and reviewed | PASS |
| Static check scope documented | PASS |
| Firebase Emulator tests present in this workflow | NO |
| Shared Firestore rules fixture approved | NO |
| Emulator authorization tests executed | NOT RUN |
| Deployed production rules verified | NOT VERIFIED |
| Safe to merge Customer Auth integration PR #5 | NOT YET — separate schema/rules and end-to-end checks remain unresolved |
| Safe to deploy Firestore rules | NO |

**Next safe action:** do not add an Emulator job using the website-only draft rules. First obtain/confirm the authorized project's currently deployed rules and agree a complete shared rules candidate covering Customer, Partner, and Admin; then add isolated Emulator tests against that reviewed candidate. No Firebase Console settings, production rules, app source, or PR #5 state were changed in Step 65.

# Step 66: Customer Auth account-choice behavior review

Reviewed the actual `customer-auth.js` source on `feature/website-customer-auth-profile-integration` (blob SHA `f618eacc4290a45d3c8148d0245a8e2f2a2b0a69`) against the login page's Existing user / New user selector.

#### Finding: account selector changes presentation, not authentication behavior

- Both selector buttons call `selectAccountType(false/true)`, which only changes `isNewUser`, button state, title, hint text, and status copy.
- Both paths then call the same `signInWithPhoneNumber(auth, "+91" + digits, recaptchaVerifier)` function and verify with `confirmationResult.confirm(code)`.
- The source does not check whether the phone number already has a customer profile before describing the flow as Existing user or New user. It also does not create the profile document at the moment of OTP verification; it links the user to the separate profile page.
- Firebase Phone Authentication sign-in can authenticate an existing account and can create an account for a previously unseen phone number. Therefore, the selector currently acts as a UI hint, not a guaranteed account-type enforcement or account-existence check.

#### Required product decision / safe correction

Avoid presenting the two choices as if they perform different backend operations unless that behavior is implemented and tested. A safer option is to label the page “Continue with phone” and let the verified UID determine whether `users/{uid}` already has a profile; existing profiles can continue to the profile/home flow, and missing profiles can be directed to profile setup. Do not use phone-number lookup APIs or disclose whether another person's phone number has an account. Keep profile reads/writes owner-scoped.

Before changing behavior, confirm the intended post-login destination and whether the website should redirect automatically after OTP or keep the current “Complete your customer profile” link. No auth source code was changed in this audit step.

| Gate | Result |
|---|---|
| Account selector source path inspected | PASS |
| Existing/New selector has separate backend behavior | NO — UI-only |
| OTP verification source identified | PASS |
| Profile creation occurs automatically at OTP verification | NO — separate profile page |
| Live Firebase Auth behavior tested | NOT RUN |
| Browser E2E tested | NOT RUN |
| Firestore deployed rules verified | NOT VERIFIED |
| Safe to deploy shared rules | NO |
| App/auth code changed | NO — report-only review |

**Step 66 status:** source behavior finding documented; no Firebase Console changes, rules changes, live OTP tests, or deployments performed.

# Step 67: Exact Customer Auth CI workflow and latest run verification

The integration workflow path has now been obtained from the changed-file list of PR #5 and read directly from branch `feature/website-customer-auth-profile-integration`:
`.github/workflows/customer-auth-integration-checks.yml` (blob SHA `f4f2532bd99104fc8093b2c0472fcc4f2d9399ff`).

Workflow behavior confirmed from source:
- Trigger: pull requests whose base branch is `feature/website-customer-profile-firestore`, plus manual `workflow_dispatch`.
- Job: `Syntax and DOM contract checks` on `ubuntu-latest`, Node.js 22.
- Checks: external `customer-auth.js` module syntax; extraction and syntax validation of the profile page's inline module; duplicate HTML IDs; local script paths; login-page DOM IDs referenced by the auth module; required account-selector/login IDs; and profile-load safety guard.
- Explicit scope limit: the workflow itself says Firebase network behavior, SMS OTP, Firestore Rules, and browser E2E are not tested.

#### Latest run checked

GitHub Actions run `39248019883`, “Customer auth integration checks” (run number 13), completed with conclusion `success`. Its job steps show the auth module syntax, profile module extraction/syntax, and HTML/DOM/local-link/load-safety checks all completed successfully.

#### Step 67 result and remaining gate

| Gate | Result |
|---|---|
| Exact integration workflow path identified | PASS |
| Workflow source inspected | PASS |
| Latest integration static CI run | PASS — run `39248019883` |
| Firebase Emulator configured/tested | NOT VERIFIED / NOT RUN |
| Live Phone Auth / SMS OTP | NOT RUN |
| Browser end-to-end login/profile flow | NOT RUN |
| Deployed Firestore rules retrieved | NOT VERIFIED |
| Safe to deploy shared Firestore rules | NO |
| PR #5 ready to merge based on these checks alone | NO — static checks do not resolve rules/schema or live-flow gaps |

No workflow, auth/profile application code, Firestore rules, Firebase Console settings, PR #5 status, or production environment was changed in Step 67. This step updates audit evidence only.

# Step 68: Customer Auth/Profile PR readiness re-check

Rechecked PR #5 and the exact source files on `feature/website-customer-auth-profile-integration` after the report-only PR #6 merge.

#### Current PR state
- PR #5: `https://github.com/dojoplatform2026/DOJO-WALK-Website-/pull/5`
- State: OPEN, DRAFT; mergeable according to GitHub metadata, but **not approved for merge by this audit**.
- Base: `feature/website-customer-profile-firestore`.
- Head SHA: `6682af62374b4943e05c50903c18e84e09082720`.
- Changed files reported: `.github/workflows/customer-auth-integration-checks.yml`, `FIREBASE_WEB_READINESS_AUDIT.md`, `customer-auth.js`, `customer-login.html`, and `customer-profile.html`.

#### Source and CI evidence rechecked
- `firebase-config.js` blob SHA `f097543e7514338f44aab286132d468f66e9d207` still names project `dojo-platform-b68a3`.
- `customer-auth.js` blob SHA `f618eacc4290a45d3c8148d0245a8e2f2a2b0a69` contains Phone Auth sign-in and `RecaptchaVerifier` usage.
- `customer-profile.html` blob SHA `e4c41d279640e6c62ee8a29786041d871ad7f922` retains the `profileLoadComplete` save guard.
- Workflow run `39248019883` (“Customer auth integration checks”, run 13) completed `success`. The job steps for JS module syntax, profile module syntax, and HTML/local-link/DOM/load-safety validation completed successfully.
- This successful run is static CI only. It does not verify real SMS, Firebase authorized domains, deployed Firestore Rules, Emulator authorization, or browser end-to-end behavior.

#### Merge gate
| Requirement | Result |
|---|---|
| Customer login/profile static checks | PASS |
| Current PR #5 state recorded | PASS — still draft/open |
| Live Phone Auth / SMS OTP verified | NOT RUN |
| Deployed Firestore Rules retrieved | NOT VERIFIED |
| Shared Customer/Partner/Admin schema and rules reconciled | NOT COMPLETE |
| Firestore Emulator positive/negative tests | NOT RUN |
| Browser E2E for login/profile | NOT RUN |
| Merge PR #5 based on current evidence | NO — keep draft/open |

**Decision:** PR #5 remains open and draft. A green static workflow is insufficient to establish shared Firestore compatibility. The checked-in Partner rules reviewed earlier still contain a booking-create denial and profile-field allowlist conflicts; deployment status of those rules remains unknown. Do not deploy any rules or treat checked-in rules as the deployed configuration.

**Step 68 status:** PR and source evidence rechecked and documented. No application source, workflow, Firebase Console settings, Firestore rules, PR state, merge, or production deployment was changed in this step. The remaining hard blocker is access to an authoritative export/snapshot of the currently deployed rules plus a reviewed shared rules candidate before Emulator tests can meaningfully validate the intended behavior.

# Step 69: Website draft profile rules vs Flutter Customer payload

Performed a direct source-level field comparison using these checked-in files:
- Website draft rules: `firestore.rules`, blob `1e94b14ec855dd0450d30b735b02859be13b3331`.
- Website profile writer: `customer-profile.html`, blob `e4c41d279640e6c62ee8a29786041d871ad7f922`.
- Flutter Customer profile writer: `dojoplatform2026/dojo-walk-customer/lib/features/profile/screens/name_setup_screen.dart`, blob `30601d4c884e2a30ffc7a7bcd4a1e09d330c3bfa`.
- Partner checked-in rules: `dojoplatform2026/dojo-partner/firestore.rules`, blob `7b02a8bfb4fe80ab04d72f59966e2e09c848ffd0`.

#### Field-level compatibility finding

The Website profile writer submits `uid`, `name`, `gender` (empty string allowed by its UI), `dateOfBirth` as a Firestore Timestamp, `age`, `phoneNumber`, `email` (empty string if absent), `photoUrl`, `role`, `profileCompleted`, `updatedAt`, and conditionally `createdAt`. It uses `setDoc(..., { merge: true })` and preserves a valid existing `createdAt` where possible.

The inspected Flutter Customer writer submits `uid`, `name`, `gender`, `dateOfBirth` as a Firestore Timestamp, `phoneNumber`, `photoUrl`, `role`, `profileCompleted`, `updatedAt`, and conditionally `createdAt`; it does **not** include `age` or `email` in this save payload.

The Website draft rules' `validProfileFields()` requires `age` to be an integer in the 18–120 range and `email` to be a string, as well as requiring other profile fields. Therefore, **if the Website draft rules were deployed as the shared ruleset, the inspected Flutter profile writer's create/update payload would fail the required-field checks** because `age` and `email` are absent. This is an additional concrete reason not to deploy those rules as shared production rules.

The Partner checked-in rules also use their own field allowlists for user create/update. The prior audit established that those allowlists do not include every field written by Website/Flutter (including `uid` and `profileCompleted` in the inspected create payload); if those rules were deployed, writes could be rejected. Actual deployed-rule provenance remains unknown.

#### Step 69 outcome

| Check | Result |
|---|---|
| Website profile payload fields inventoried | PASS |
| Flutter Customer profile payload fields inventoried | PASS |
| Website draft rule vs Flutter payload | INCOMPATIBLE — required `age` and `email` missing in Flutter payload |
| Shared rules candidate ready | NO |
| Deployed rules status known | NO — not verified |
| Emulator tests run | NOT RUN |
| Production deployment | NO |

**Required design resolution before rules implementation:** agree a canonical shared `users/{uid}` schema across Website and Flutter Customer, explicitly decide whether `age` is stored or derived from `dateOfBirth`, decide whether `email` is optional, and define allowed create/update fields without breaking existing profile documents. Then validate all clients' positive and negative cases against one reviewed rules candidate in the Firestore Emulator.

No source code, Firestore rules, Firebase Console settings, PR state, or production environment was changed in Step 69; only this audit report was updated.

# Step 70: Customer login/profile integration PR merge status

On 2026-10-19, customer login/profile integration PR #5 was promoted from Draft to Ready for review and merged after checking its latest GitHub Actions static check run (run ID `39248019883`, conclusion `success`). The completed job `Syntax and DOM contract checks` validated external auth module syntax, extracted profile module syntax, HTML/local links, DOM selectors, and the profile-load safety guard.

- Merge commit: `80c3ecfc2e4acd9b2c1d15bb05d2e723fae0bf2f`
- **Target branch:** `feature/website-customer-profile-firestore` (not `main`).
- PR files: `.github/workflows/customer-auth-integration-checks.yml`, `FIREBASE_WEB_READINESS_AUDIT.md`, `customer-auth.js`, `customer-login.html`, and `customer-profile.html`.

## Step 70 result

| Check | Result |
|---|---|
| Static CI for latest PR head | PASS (run 39248019883) |
| PR #5 merged | PASS |
| Integration code on target feature branch | PASS |
| Integration code merged to `main` | NO — PR base is the profile-firestore feature branch |
| Firebase live Phone Auth / SMS OTP | NOT VERIFIED |
| Deployed shared Firestore rules compatibility | NOT VERIFIED |
| Firestore Emulator security tests | NOT RUN |
| Browser end-to-end test | NOT RUN |
| Firestore rules or Firebase production deployment | NO |

This merge advances the code integration but does not certify production readiness. Do not deploy Firestore rules from this branch. The known draft rules/schema compatibility findings from Step 69 remain unresolved until currently deployed rules are authoritatively inspected, the shared schema is agreed, and positive/negative Emulator tests pass.

No Firebase Console settings or production data were changed in Step 70.



# Step 71: Main-branch report and integration promotion status reconciliation

Re-checked GitHub PR metadata and fetched the audit report from `main`.

- PR #6 (report-only update) is merged into `main`; merge commit `e4b11ca74a3f4c6464078c8c06beef2506c65c44`.
- PR #5 (customer auth/profile integration) is merged into `feature/website-customer-profile-firestore`, merge commit `80c3ecfc2e4acd9b2c1d15bb05d2e723fae0bf2f`. Its base branch is a feature branch, so this does not mean the integration code is on `main`.
- PR #2, #3 and #4 remain open drafts, with dependency chain: #2 `feature/website-home-screen-market-polish` → `main`; #3 `feature/website-customer-login-structure` → home-polish branch; #4 `feature/website-customer-profile-firestore` → customer-login branch. They require ordered review; no merge was performed in this step.
- The known successful auth integration static CI run is `39248019883`; its coverage does not establish live Firebase, Emulator, or browser E2E success.

| Gate | Result |
|---|---|
| Audit report present on `main` | PASS |
| PR #6 report merge verified | PASS |
| PR #5 integration merge verified | PASS — feature branch only |
| PRs #2–#4 status verified | PASS — still draft/open |
| Customer integration on `main` | NO |
| Shared Firestore schema/rules approved | NO |
| Emulator security tests | NOT RUN |
| Live OTP/browser E2E | NOT VERIFIED |
| Production rules deployment | NO |

No application source, Firestore rules, Firebase Console configuration, or PR merge state was changed in Step 71; this step reconciles the audit summary with verified GitHub metadata.

# Step 72: Current PR chain, merge state, and CI evidence reconciliation

Read-only GitHub metadata and changed-file patches were checked for PRs #2–#6. This section records the current observed state as of 2026-10-19.

## Current PR state

| PR | Scope | State | Base → head | Decision |
|---|---|---|---|---|
| #2 | Home screen polish | OPEN / DRAFT | `main` ← `feature/website-home-screen-market-polish` | Do not merge yet: draft remains, GitHub currently reports mergeability false, although its known static website validation run passed. Resolve the mergeability state and complete review first. |
| #3 | Customer login structure | OPEN / DRAFT | `feature/website-home-screen-market-polish` ← `feature/website-customer-login-structure` | Do not merge yet: draft remains; no PR-triggered run was returned by the inspected workflow-run endpoint for the current head SHA. |
| #4 | Profile Firestore integration and draft rules | OPEN / DRAFT | `feature/website-customer-login-structure` ← `feature/website-customer-profile-firestore` | Do not merge yet: draft remains and GitHub currently reports mergeability false. It introduces a website-only Firestore rules file that denies all collections except the user profile; this is not a shared production ruleset. |
| #5 | Customer auth/profile integration | CLOSED / MERGED | `feature/website-customer-profile-firestore` ← `feature/website-customer-auth-profile-integration` | Merge verified; merge commit `80c3ecfc2e4acd9b2c1d15bb05d2e723fae0bf2f`. This promotes the integration only into the profile feature branch, not to `main`. |
| #6 | Firebase readiness audit report | CLOSED / MERGED | `main` ← `docs/firebase-readiness-audit-main` | Merge verified; merge commit `e4b11ca74a3f4c6464078c8c06beef2506c65c44`. |

## CI evidence checked

- PR #2 head commit `08dd6ae2116ba2ea58bb4cbda7e7e5f3c93ea32f`: workflow run `39176442781`, “Validate static website”, completed successfully. This is a static website validation only.
- PR #3 head commit `4f7f6c36a320ba44a5efec286bcdff271ba82017`: the inspected PR-triggered workflow-run query returned no runs. This is **not** evidence of a failure or a pass; CI status remains unverified for this check.
- PR #4 head commit `80c3ecfc2e4acd9b2c1d15bb05d2e723fae0bf2f`: the inspected PR-triggered workflow-run query returned no runs. This is **not** evidence of a failure or a pass; CI status remains unverified for this check.
- PR #5's earlier static auth-integration checks do not establish Firebase Emulator, live OTP, browser E2E, or deployed-rules correctness.

## Step 72 decision and next gate

Do not merge PRs #2–#4 while they are still drafts and PR #2/#4 report mergeability false. The dependency order remains #2 → #3 → #4, with PR #5 already incorporated into the #4 head branch. First resolve the current GitHub mergeability/conflict state, make each PR ready for review, and validate the combined code and static CI in dependency order. Keep the shared Firestore rules deployment blocked until the actual deployed rules are obtained, the shared Customer/Partner/Admin schema is agreed, and positive/negative Emulator tests are executed.

| Gate | Result |
|---|---|
| PR #5 merged into profile feature branch | PASS |
| PR #6 report merged into `main` | PASS |
| PR #2 static website run | PASS (static scope only) |
| PR #3 current-head CI result confirmed | NOT VERIFIED |
| PR #4 current-head CI result confirmed | NOT VERIFIED |
| PR #2–#4 ready for review | NO — remain draft |
| PR #2 and #4 mergeability | BLOCKED / FALSE at last metadata check |
| Customer integration code on `main` | NO |
| Shared Firestore rules approved and Emulator-tested | NO |
| Production Firebase rules deployment | NO |

No source code, workflow, Firestore rules, Firebase Console settings, PR draft state, merge state, or production data was changed in Step 72. Only this audit report was updated.

