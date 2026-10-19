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
