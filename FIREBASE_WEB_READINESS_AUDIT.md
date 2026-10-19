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
