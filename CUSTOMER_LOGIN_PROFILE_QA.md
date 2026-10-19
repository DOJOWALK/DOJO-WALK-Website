# Customer Login and Profile — Static QA Report

Date: 2026-10-19

## Static checks completed

- Indian mobile input validation checks for a 10-digit number beginning with 6–9.
- OTP input validation checks for exactly six digits.
- Firebase Phone Authentication calls `signInWithPhoneNumber` with reCAPTCHA.
- OTP confirmation calls `confirmationResult.confirm(code)`.
- Sign-out uses Firebase Auth `signOut`.
- Status messages are rendered using `textContent`, not HTML injection.
- Login page includes the expected form, phone, OTP, reCAPTCHA, action, and next-step elements.
- Profile page checks Firebase Auth state and redirects signed-out visitors to customer login; save is guarded by the current signed-in user.
- Login page shows the customer-profile next-step link after Firebase reports a signed-in user; OTP success messaging now directs the user to the profile step. This is static review only; click-through and browser session restoration were not tested.
- Profile form checks age is between 18 and 120 in client-side code.
- Profile writes to `users/{currentUser.uid}` with merge enabled.
- Static check confirms the profile page and rules use the same owner-scoped user document path.
- Draft PR #4 exists and remains open/draft: https://github.com/dojoplatform2026/DOJO-WALK-Website-/pull/4

## Security review findings

- The `age` value is calculated/validated in client-side code and supplied with the write. A modified client could potentially submit an age that does not match `dateOfBirth`. Do not treat this field as proof of age for legal or eligibility decisions. A trusted server-side validation or a rules design that reliably verifies the date-of-birth cutoff is needed before enforcing age eligibility.
- The current draft `firestore.rules` denies every collection other than `users/{userId}`. Since Firestore rules apply to the shared database, deploying this draft without auditing the customer app, partner app, admin portal, and existing collections could break them.
- The rules restrict updates to a set of profile fields, but they have not been run through Firebase Emulator tests or deployed-rule tests.

## Shared-schema compatibility findings

- The existing Flutter customer app writes `users/{uid}.dateOfBirth` as a Firestore `Timestamp` (in `lib/features/profile/screens/name_setup_screen.dart`), while this website writes `dateOfBirth` as a `YYYY-MM-DD` string. The customer app's current parser accepts both Timestamp and String, but the draft website rules only accept String. This is a mixed-type schema and must be standardized deliberately before production.
- The existing customer app stores `photoUrl` and reads the shared `users/{uid}` document. The website currently preserves a loaded photo URL but does not upload/change profile photos. Confirm all required fields and types across clients before changing rules.
- The Partner repository has its own Firestore rules for `walkers/{walkerUid}` and other collections. This website's draft rules are not a complete shared-project ruleset and must not replace the canonical rules used by Customer, Partner, and Admin.
- Compatibility search is a focused source review, not a complete audit of every repository, collection, Cloud Function, or deployed rule.

## Step 16 — Field-by-field comparison with the current Customer app

The current `NameSetupScreen` writes to `users/{uid}` with merge enabled and includes:
- `uid` (Firebase Auth UID)
- `name`
- `gender`
- `dateOfBirth` as a Firestore `Timestamp`
- `phoneNumber`
- `photoUrl`
- `role: "customer"`
- `profileCompleted: true`
- `updatedAt` as a server timestamp
- `createdAt` as a server timestamp on first creation or when missing

The website currently writes `name`, `gender`, `dateOfBirth` as a string, `age`, `phoneNumber`, `email`, `photoUrl`, and `updatedAt`. This confirms several differences beyond the date type: the website adds `age` and `email`, while it does not currently write the Customer app's `uid`, `role`, `profileCompleted`, or `createdAt` fields. Because the website uses merge writes, it should preserve existing fields on an existing document, but a profile first created by the website may not have the fields the mobile app expects.
  
**Step 16 conclusion:** do not change shared schema or deploy rules yet. Before code changes, decide whether the website should create the same minimum profile fields as the Flutter app and standardize `dateOfBirth` to Timestamp across both clients. Also confirm whether `email` and `age` are truly required by other consumers; they are not written in the inspected Customer `NameSetupScreen`. This was source review only, not a live database audit.

## Not tested — do not claim these work yet

- Real SMS delivery and OTP verification on the deployed GitHub Pages domain.
- Firebase Phone Authentication and reCAPTCHA settings in the live project.
- Actual Firestore profile reads/writes against deployed rules.
- Firebase Emulator rule tests.
- Mobile-browser visual and accessibility testing.
- End-to-end navigation and session behavior on a real Android device.

## Deployment blockers

1. The GitHub Pages deployment workflow runs from `main`; feature branch changes are not live until reviewed and merged.
2. The draft Firestore ruleset must not be deployed until the full shared-project ruleset is audited and tested.
3. Customer login/profile changes are in feature branches and are not live.
4. PR #4 is open as a draft and has not been merged.

## Result

Static source-code checks only. This is not a live integration test, security certification, or production-readiness approval.
