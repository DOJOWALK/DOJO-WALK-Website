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
- Profile form checks age is between 18 and 120 in client-side code.
- Profile writes to `users/{currentUser.uid}` with merge enabled.
- Static check confirms the profile page and rules use the same owner-scoped user document path.
- Draft PR #4 exists and remains open/draft: https://github.com/dojoplatform2026/DOJO-WALK-Website-/pull/4

## Security review findings

- The `age` value is calculated/validated in client-side code and supplied with the write. A modified client could potentially submit an age that does not match `dateOfBirth`. Do not treat this field as proof of age for legal or eligibility decisions. A trusted server-side validation or a rules design that reliably verifies the date-of-birth cutoff is needed before enforcing age eligibility.
- The current draft `firestore.rules` denies every collection other than `users/{userId}`. Since Firestore rules apply to the shared database, deploying this draft without auditing the customer app, partner app, admin portal, and existing collections could break them.
- The rules restrict updates to a set of profile fields, but they have not been run through Firebase Emulator tests or deployed-rule tests.

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
