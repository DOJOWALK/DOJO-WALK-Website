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
- Profile page checks that a Firebase user is signed in before saving.
- Profile form checks age is between 18 and 120.
- Profile writes to `users/{currentUser.uid}` with merge enabled.
- Static check confirms the profile page and rules use the same owner-scoped user document path.

## Not tested — do not claim these work yet

- Real SMS delivery and OTP verification on the deployed GitHub Pages domain.
- Firebase Phone Authentication and reCAPTCHA settings in the live project.
- Actual Firestore profile reads/writes against deployed rules.
- Firebase Emulator rule tests.
- Mobile-browser visual and accessibility testing.
- End-to-end navigation and session behavior on a real Android device.

## Deployment blockers

1. The GitHub Pages deployment workflow runs from `main`; feature branch changes are not live until reviewed and merged.
2. The profile branch contains a draft Firestore ruleset that denies access to all collections except `users/{userId}`. This could break other apps using the same Firebase database. Do not deploy those rules until the full shared-project ruleset is audited and tested.
3. Customer login/profile changes are in feature branches and are not live.
4. A Draft PR for the profile branch has not been successfully created.

## Result

Static checks passed for the listed source-code patterns only. This is not a live integration test, security certification, or production-readiness approval.
