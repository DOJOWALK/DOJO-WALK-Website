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

- The existing Flutter customer app writes `users/{uid}.dateOfBirth` as a Firestore `Timestamp` (in `lib/features/profile/screens/name_setup_screen.dart`). The website was initially reviewed while it wrote a `YYYY-MM-DD` string; that finding is historical and superseded by Step 17/22, where the current website writer was aligned to Firestore `Timestamp`. The draft website rules also require Timestamp. This is a static source comparison; existing stored documents and every consumer have not been audited live.
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

## Step 17 — Website profile schema alignment (static review)

- Website profile writes now include `uid`, `role: "customer"`, and `profileCompleted: true`, matching the fields written by the inspected Flutter Customer `NameSetupScreen`.
- Website writes `dateOfBirth` as a Firestore `Timestamp`, matching the Flutter Customer app's create/update flow.
- Website checks the existing user document and only sets `createdAt` when the document is new or that field is missing; writes continue to use merge mode.
- Draft rules were updated to expect the aligned fields, Timestamp dateOfBirth, owner UID, customer role, completed profile, and server timestamp fields.
- Static source checks only. These rules are still a draft: they deny every other collection, have not been emulator-tested, and must not be deployed to the shared Firebase project without full ruleset integration/review.
- The `age` field remains client-calculated; these rules only validate its type/range and do not prove it matches dateOfBirth. Do not use it as trusted age verification.

## Step 18 — Profile save/load static review

- Found and fixed a date-input compatibility bug: the website previously assigned Firestore `dateOfBirth` directly to an HTML date input. Since the value is now a Firestore Timestamp, that can fail to populate the date field.
- Added a conversion helper that accepts the canonical Firestore Timestamp and legacy `YYYY-MM-DD` string format, converts valid values to the date input format, and leaves unsupported/invalid values blank.
- Reviewed save flow: it reads the existing document, preserves `createdAt` when present, sets it when missing, and performs a merge write.
- The rules expect a phone-auth token phone number to match `phoneNumber`; actual behavior still needs Firebase Emulator/live Auth testing, especially for accounts whose auth token lacks that claim.
- Static source review only; no real Firebase read/write, browser, emulator, or Android test was run.

## Step 19 — Auth claim and Firestore field compatibility

- Added a client-side guard: if Firebase Auth does not expose a verified `currentUser.phoneNumber`, the website now stops before writing and asks the user to sign in again. It no longer sends an empty phone number that would fail the draft rule's token-claim comparison.
- The saved phone number now comes directly from the signed-in Firebase user. The Firestore rule still enforces equality with `request.auth.token.phone_number`; this has not been proven against the live project's token or emulator.
- Improved `createdAt` handling: preserve an existing value when it looks like a Firestore Timestamp; otherwise, replace a missing/malformed value with a server timestamp so the draft rule's type check can pass.
- These are defensive static-code changes only. No live Firebase Auth claim inspection or Firestore Emulator test was performed.
- Security reminder: this draft rules file denies all collections other than `users/{uid}`; do not deploy it to the shared Firebase project as-is.

## Step 20 — DOB/age validation and createdAt rule review

- Confirmed the website validates DOB as a real `YYYY-MM-DD` date, rejects future dates, and computes age on the client before allowing profile save.
- Confirmed the draft rules require a Timestamp DOB and integer age in the 18–120 range. The rules do **not** independently prove that age matches DOB, so a modified client could submit an inconsistent age; this remains a security limitation.
- Tightened draft update rules so a valid existing `createdAt` Timestamp must remain unchanged. Missing or malformed legacy values can still be repaired to a Timestamp, subject to the rest of the profile validation.
- The rules still deny all non-`users/{uid}` collections. Do not deploy this partial ruleset to the shared Firebase project.
- Static inspection only. Firestore Rules syntax/behavior has not been tested in the Emulator, and no live profile writes were performed.

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

## Step 21 — Login → profile navigation and session static review

- Checked that the login page loads `customer-auth.js`, its form/button IDs match the script selectors, OTP confirmation calls Firebase Auth, and the auth-state listener exposes the profile link for an already signed-in session.
- Checked that the profile page listens for Firebase Auth state, redirects signed-out users to `customer-login.html`, enables saving only when a user is signed in, uses the expected `profile-form`/save/sign-out element IDs, and sends a signed-out user back to login after sign-out.
- No redirect loop was found in the inspected source: login intentionally offers a profile link rather than forcing an automatic redirect, while the protected profile redirects only when no session exists.
- Corrected stale login copy that implied personal-profile saving was not implemented, and corrected the signed-in status text. Dog details and booking functionality remain unconnected.
- Static string/selector/path inspection only. No browser execution, persisted-session test, real OTP, live Firestore operation, or Android end-to-end test was performed.

## Step 22 — Firebase config, import paths, and profile schema review

- Confirmed that both the login auth module and profile page import the same relative `./firebase-config.js` module and use Firebase JavaScript SDK version 11.10.0 for the Auth/App/Firestore modules inspected.
- Confirmed the checked-in public web config names Firebase project `dojo-platform-b68a3`; this is client-side Firebase configuration, not a service-account credential. Authorized domains, Phone provider enablement, quotas, and deployed project settings were not checked from the Firebase Console.
- Confirmed `customer-login.html` loads `customer-auth.js` as a module, and the profile page links back to `customer-login.html`; these relative paths are consistent with the files in the website root.
- Found a concrete legacy DOB loader bug: the string-format regular expression in `dateOfBirthInputValue()` was over-escaped, so valid legacy `YYYY-MM-DD` strings would not match. Corrected the expression to use the intended digit patterns. Firestore Timestamp values continue through the Timestamp conversion branch.
- Static schema check: website writes `dateOfBirth` as a Firestore Timestamp and the draft rule expects a Timestamp; profile document path remains `users/{uid}`. This does not replace a full shared-project schema/rules audit.
- Validation performed: source string/path/config checks and exact regex correction review only. No browser execution, JavaScript runtime test, Firebase Console inspection, live Auth/Firestore request, or Emulator test was run.
- Security/deployment warning remains: `firestore.rules` is a partial draft that denies all collections except the user's own `users/{uid}`; do not deploy it to the shared project as-is.


## Step 23 — Profile save/load and draft-rules consistency review

- Re-fetched the current profile page, draft Firestore rules, and this QA report from `feature/website-customer-profile-firestore`.
- Checked the profile form's `name`, `gender`, `dob`, `profile-form`, `status`, `save`, `signout`, and `account-line` selectors against the HTML; all selectors referenced by the module are present.
- Checked load/save handling: signed-out users are redirected to login; profile reads and writes are wrapped in error handling; the save button is disabled during save and restored in `finally`; save uses `setDoc(..., { merge: true })`; existing valid `createdAt` is preserved, while a missing/malformed value is repaired.
- Checked the rules against the current writer: the create allow-list covers the fields the page writes; update `affectedKeys()` limits changed fields; owner UID and Firebase phone claim are checked; valid existing `createdAt` cannot be changed; deletes are denied. The catch-all deny also means these rules are not a safe complete ruleset for the shared Firebase database.
- Corrected the earlier shared-schema paragraph so it clearly marks the string-DOB observation as historical and reflects the current Timestamp writer/rules alignment.
- No additional profile code or rules change was warranted by this static pass. No JavaScript execution, browser test, Firebase Emulator test, live Firestore operation, deployed-rule check, or cross-repository full rules audit was performed.

**Step 23 result:** Static review completed; no merge or deployment. The partial `firestore.rules` file remains a deployment blocker until integrated with and tested against the full shared-project ruleset.


## Step 24 — Login edge-case review

- Re-fetched and inspected the login HTML and JavaScript, profile page, and shared Firebase config module on this feature branch.
- The login page contains the selectors used by its JavaScript module. OTP request, confirmation, busy-state handling, reCAPTCHA cleanup, sign-out, and persisted-auth-state logic were reviewed statically only.
- **Issue recorded for a focused follow-up:** after an OTP is requested, the phone input remains editable while the pending confirmation result belongs to the originally requested number. Editing the visible number can therefore confuse which number the OTP is verifying. Add a change-number/restart flow or lock the field with an explicit reset action before production.
- The Existing user/New user toggle changes labels and copy; it does not itself determine whether the Firebase account already exists.
- No code/rules change, merge, or deployment was made. No browser runtime, real SMS, Firebase Emulator, live Auth/Firestore, or Android test was run.

**Step 24 result:** Static edge-case review completed. One login state/UX issue is documented for the next step. The partial Firestore rules must not be deployed to the shared project as-is.

## Step 25 — OTP phone-change/restart flow

- Added a visible **Change number / restart** control to the login page; it remains hidden until Firebase successfully sends an OTP.
- Once an OTP is requested, the phone input and Existing/New account-choice buttons are disabled so the displayed number cannot drift away from the pending Firebase confirmation result.
- The restart control clears the pending confirmation result and OTP input, hides the OTP row, re-enables the phone/account-choice controls, resets the primary action to **Send OTP**, clears the old reCAPTCHA verifier/container, and prompts the user to enter the correct number and request a new OTP.
- The restart control is disabled while the flow is busy and is hidden after sign-in; the auth-state listener also hides it for an already signed-in session.
- Static checks reviewed the new HTML control ID, JavaScript selector/listener, phone-lock state after OTP send, reset state, and signed-in/signed-out handling.
- No browser execution, real SMS/OTP, Firebase Emulator, live Auth/Firestore, or Android test was run. No merge or deployment was performed.

**Step 25 result:** The mismatch between an editable phone field and the pending OTP confirmation is addressed in source. Runtime verification remains outstanding; PR #4 remains a draft, and the partial Firestore rules must not be deployed to the shared project as-is.

## Step 26 — Auth-state and reCAPTCHA cleanup review

- Reviewed sign-out and auth-state transitions after Step 25.
- Fixed cleanup so the reCAPTCHA verifier/container is cleared on a successful sign-out and during an idle signed-out auth-state transition. The cleanup is skipped inside the auth listener while another auth action is busy to avoid interrupting an in-flight OTP request.
- Static review confirms the restart action still clears the pending confirmation result and the sign-out path now explicitly clears reCAPTCHA before reporting success.
- This remains source-level review only. No JavaScript/browser execution, SMS delivery, Firebase Auth/Firestore request, Emulator test, or Android end-to-end test was run.
- No merge or deployment was performed. The partial Firestore rules remain unsafe to deploy to the shared project until the full customer/partner/admin ruleset is integrated and tested.

**Step 26 result:** Auth-state cleanup improvement committed on the feature branch; runtime behavior still requires testing.

## Step 27 — Website navigation and pre-merge status audit

- Inspected the six core HTML pages on the customer-profile feature branch: home, customer login, customer profile, privacy, terms, and cancellation/refunds.
- Checked local page links and fragment anchors among those inspected pages; no missing page targets or missing in-page anchor IDs were found in this scoped check.
- Reviewed current PR metadata: PR #2, PR #3, and PR #4 are all open, draft, unmerged, and reported mergeable by GitHub. PR #4 targets PR #3; PR #3 targets PR #2; PR #2 targets main, so the intended merge sequence remains dependency-ordered.
- No pull-request workflow runs were returned for the latest PR #4 QA commit. This is not proof that no checks exist elsewhere; no successful automated test run was verified in this check.
- This navigation audit does not establish that binary image assets load, that pages render correctly on Android, or that Firebase OTP/profile operations work.
- Merge blockers remain: real OTP/reCAPTCHA verification, browser/mobile checks, live or Emulator Firestore profile tests, and a complete shared-project Firestore rules audit. The partial firestore.rules must not be deployed as-is.
- No PR was merged, marked ready, or deployed.

**Step 27 result:** Scoped navigation review completed. The change set is not yet production-verified and should remain draft until the runtime/security blockers are resolved.

## Step 28 — Remove misleading Existing/New account toggle

- Removed the Existing user/New user selector because it only changed page copy and did not control Firebase account existence or the underlying phone-auth flow.
- Replaced it with neutral copy explaining that the same phone-number flow is used for sign-in, while Firebase handles account creation according to its Auth configuration.
- Simplified the success status so it no longer claims the selected toggle determined the account type. The profile next-step link remains available after successful sign-in.
- Static checks re-fetch the HTML and auth module to verify the old toggle IDs/handlers and the `isNewUser` conditional are gone, while the phone-lock/restart flow remains.
- No browser execution, live Firebase Auth test, real SMS/OTP, Firestore test, or Android test was run. No merge or deployment was performed.

**Step 28 result:** The UI no longer implies that the Existing/New buttons control Firebase account creation. Runtime and shared-rules security checks remain pre-merge blockers.
