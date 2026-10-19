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
