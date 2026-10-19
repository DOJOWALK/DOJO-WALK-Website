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

## Step 29 — PR dependency and branch-drift check

- Compared PR #4's feature branch against its intended base, `feature/website-customer-login-structure`.
- GitHub's compare result reports the feature branch has 38 commits ahead and 3 commits behind the current base branch. The changed paths include `customer-auth.js` and `customer-login.html`, so this is a real branch-history divergence to resolve before merging.
- PR #4 currently reports `mergeable: false`; PR #2 and PR #3 still report mergeable. PR #4 remains open/draft/unmerged.
- No PR was merged, no branch was force-pushed, and no deployment was performed. The safe next step is to synchronize PR #4 with its current base and review any conflicts, then re-check GitHub mergeability. Do not bypass this by merging PR #4 directly into main.
- Runtime blockers remain: actual SMS/reCAPTCHA, browser/Android testing, Firestore Emulator/live profile checks, and full shared-project rules audit. The partial Firestore rules must not be deployed as-is.

**Step 29 result:** A branch-sync blocker was found. Do not merge PR #4 until its base-branch divergence is resolved and mergeability is re-checked.


## Step 30 — Inspect overlapping base-branch changes

- Rechecked the current PR #3 and PR #4 metadata and compared PR #4's head with its intended base. PR #4 is still open/draft/unmerged and GitHub reports `mergeable: false`; the feature branch is 39 commits ahead and 3 commits behind the base.
- Inspected the current `customer-auth.js` and `customer-login.html` versions on both branches. The base branch's latest visible change updates the signed-in status copy and reveals the profile next-step link; PR #4's branch additionally contains the phone-number restart flow, reCAPTCHA cleanup, and removal of the misleading Existing/New selector.
- The two branches edit the same auth/login files, so blindly copying the base versions would discard PR #4 work. No safe branch synchronization was performed in this step because the available connector path did not provide a verified merge/conflict-resolution workflow or tree metadata to create a normal merge commit safely.
- Next safe action is to inspect all three commits unique to the base and resolve the overlapping files while preserving both sets of intended behavior, then re-run static checks and re-check PR mergeability.
- No branch history was rewritten, no force-push was made, no PR was merged, and no deployment was performed.
- Runtime/security blockers are unchanged: no real SMS/reCAPTCHA, browser/Android end-to-end, Firestore Emulator/live profile test, or full shared-project Firestore rules audit has been verified. Do not deploy the partial Firestore rules.

**Step 30 result:** The overlapping behavior is identified; PR #4 remains blocked pending a safe branch sync and runtime/security validation.


## Step 31 — Verify branch-only commits and automated checks

- Compared the current PR #3 base head against the recorded merge base. Exactly three commits are ahead of the merge base; their net file changes are limited to `customer-auth.js` and `customer-login.html` (two additions and two deletions in each file).
- Reviewed PR #3 and PR #4 patches. PR #4's versions include additional OTP restart/phone lock, reCAPTCHA cleanup, and removal of the account-type toggle; these should not be overwritten by copying PR #3 files wholesale.
- Queried combined commit status and PR-triggered workflow runs for the current PR #4 head. The connector returned no status entries and no workflow runs, so no passing CI run is verified. This does not prove that no workflow is configured.
- PR #4 remains open/draft/unmerged and reports `mergeable: false`; the branch comparison remains diverged (40 commits ahead, 3 behind). The available GitHub connector does not expose the Git tree metadata or a conflict-resolution/merge-branch action needed to construct and verify a normal merge commit safely. I did not attempt a force update or manually rewrite branch history.
- Therefore, the branch synchronization blocker is still open. Do not merge PR #4 yet. Continue with a normal Git merge/rebase in a Git-capable environment or enable a supported merge-branch operation, resolve the two overlapping files while preserving both feature sets, and recheck GitHub mergeability.
- No PR was merged, no deployment was performed, and no Firebase rules were deployed. Live SMS/reCAPTCHA, browser/Android end-to-end, Firestore Emulator/live profile tests, and the complete shared-project rules audit remain unverified.

**Step 31 result:** Base-only changes are scoped to the auth/login files, but PR #4 still cannot be safely synchronized using the available operations. Automated checks are not verified as passing.


## Step 32 — Shared Firestore rules and profile validation review

- Re-read `firestore.rules`, `customer-profile.html`, and `FIRESTORE_SECURITY_DEPLOYMENT.md` on the PR #4 branch.
- Confirmed the draft rules allow owner-only access to `users/{uid}`, deny deletes, and deny all other collections. The deployment note correctly warns this is a database-wide ruleset and must not be deployed until customer/partner/admin collection requirements are audited.
- Identified a validation gap for follow-up: the website calculates `age` from `dateOfBirth`, but Firestore rules independently validate only that `age` is an integer between 18 and 120 and `dateOfBirth` is a timestamp. Rules do not currently prove that the supplied age matches the date of birth or enforce the adult threshold from the date itself. Client-side validation alone is not a security boundary; add Emulator tests and choose a server/rules validation strategy before production.
- Confirmed the profile writes a Firestore Timestamp for date of birth and server timestamps for created/updated fields. This was a static source review only, not an emulator or live Firebase test.
- Current PR metadata: PR #2 and #3 are open/draft and reported mergeable; PR #4 is open/draft and reported not mergeable. These are GitHub metadata observations only and do not mean tests passed.
- No Firebase rules deployment, PR merge, branch rewrite, or website deployment was performed.

**Step 32 result:** Security review found no reason to deploy the draft rules; the shared-project audit and DOB/age validation strategy remain required blockers.


## Step 33 — Correct signed-in guidance and recheck

- Found outdated signed-in status copy in `customer-auth.js`: it said customer profile saving still needed to be implemented even though the profile page and save flow already exist on this feature branch.
- Updated the auth-state status message to direct signed-in customers to the profile page, while accurately stating that dog details and bookings are not connected.
- Re-fetched both changed auth code and QA report after the write. Static check confirms the old misleading message is absent and the new guidance is present.
- PR #4 still requires branch synchronization with PR #3. It remains open/draft/unmerged and is not reported mergeable. This step does not resolve that branch conflict.
- No live browser, SMS/reCAPTCHA, Firebase Emulator, Firestore read/write, or Android end-to-end test was run. No PR was merged and no deployment or rules deployment occurred.

**Step 33 result:** Misleading login status copy fixed and statically rechecked. Branch sync and runtime/security validation remain launch blockers.


## Step 34 — Cross-file Firebase configuration and security consistency audit

- Compared `firebase.json`, `firestore.rules`, `customer-profile.html`, `customer-auth.js`, and the deployment checklist on the PR #4 feature branch.
- Static checks confirmed the Firebase CLI configuration points to `firestore.rules`; profile reads/writes are scoped in code to `users/{currentUser.uid}`; rules include an owner UID check and match the stored phone number to the Firebase Auth phone claim; the catch-all rule denies other collections; the profile code checks ages 18–120 and stores DOB as a Firestore Timestamp; and the OTP restart handler remains present.
- The same review confirms the security boundary is not production-ready: catch-all denial can break other clients sharing this database, and rules do not independently derive age from DOB. The deployment checklist correctly says rules have not been emulator-tested or deployed.
- No changes were made to Firebase rules or deployed configuration in this step because a safe shared-project ruleset and emulator test results are not available.
- PR #4 remains open/draft and branch synchronization with PR #3 remains unresolved. No merge, deployment, or live Firebase test was performed.

**Step 34 result:** Cross-file static consistency checks completed; no production security approval granted.


## Step 35 — Document required Firestore Emulator security matrix

- Added an explicit test matrix to `FIRESTORE_SECURITY_DEPLOYMENT.md` covering unauthenticated access, owner vs cross-user access, valid profile writes, phone-claim mismatch, invalid age, DOB/age mismatch, protected `createdAt`, unexpected fields, deletes, and dependent customer/partner/admin collections.
- The matrix clearly marks the DOB/age mismatch as a known gap in the current rules and says expected behavior must be enforced by the final design.
- This is test planning/documentation only. No Emulator Suite was available or run in this step; none of the cases are marked as passed.
- No rules were deployed, no branch history was rewritten, and no PR was merged.
- PR #4 remains open/draft and GitHub currently reports it as not mergeable; branch synchronization is still blocked.

**Step 35 result:** Security test plan committed and verified; actual Emulator execution and branch synchronization remain outstanding.


## Step 36 — Recheck PR branch ancestry before synchronization

- Re-fetched PR #3 and PR #4 metadata and compared the PR #4 feature branch against the PR #3 branch and the recorded common ancestor.
- The comparison API reports the PR #3 branch has three commits beyond the recorded common ancestor, touching only `customer-auth.js` and `customer-login.html`; these overlap the profile branch's auth/login edits and must not be blindly overwritten.
- GitHub PR metadata and compare responses are not fully consistent about the current base SHA/branch ancestry during this check. PR #4 is still reported `mergeable: false`, so no merge tree or branch ref was changed.
- A safe synchronization requires a Git-capable environment to fetch both branch tips, perform a normal merge/rebase with conflict review, run the static and runtime tests, and push the resulting commit. Do not force-push or synthesize a tree without verifying the exact branch trees.
- No PR was merged, no branch ref was moved, and no Firebase deployment or runtime test was performed.

**Step 36 result:** Branch ancestry rechecked; overlapping auth/login changes and inconsistent PR metadata confirmed as blockers to safe automated synchronization.


## Step 37 — Repeatable cross-file static consistency checks

- Re-fetched the login HTML, auth module, profile page, Firebase web config, Firestore rules, and Firebase CLI config from the PR #4 branch.
- Static checks matched all nine login DOM IDs to both HTML and auth-module lookups; the OTP restart handler and pending-confirmation reset remain present; the old account-type toggle identifiers remain absent.
- Profile code still contains DOB-to-Timestamp conversion and client-side age bounds of 18–120. Rules still include owner UID and Firebase phone-claim checks, a catch-all deny, and `firebase.json` still points to `firestore.rules`.
- Confirmed the fetched Firebase web config has no obvious service-account private-key material. This is a pattern-based check, not a full secret scan.
- These checks inspect source text only. They do not prove JavaScript executes correctly in a browser, Firebase Auth/Firestore works, the rules are safe for other apps, or the site renders on Android. No Emulator, SMS, browser E2E, or production test was run.
- PR #4 remains open/draft and not mergeable. No merge, ref update, or deployment was performed.

**Step 37 result:** Cross-file static checks passed for the listed source invariants; runtime/security validation and safe branch synchronization remain outstanding.


## Step 38 — Review overlapping login changes for a safe integration plan

- Compared the actual `customer-auth.js` and `customer-login.html` contents on PR #3's branch and PR #4's branch.
- PR #3's branch still contains the old Existing/New account-type toggle; PR #4's branch removes that toggle. Keep the removal in the intended integrated version.
- PR #4 adds the Change Number / Restart control, clears reCAPTCHA after sign-out and while idle signed-out, and keeps the phone field locked while an OTP confirmation is pending. Those behaviors must be preserved.
- The signed-in guidance differs slightly between branches; both versions correctly say dog details and bookings are not connected. Keep the clearer profile guidance from the PR #4 version.
- This is a source-level conflict-resolution plan, not a Git merge. The available connector exposes no verified branch-tree retrieval/normal merge workflow, so no synthetic merge commit or branch ref update was attempted.
- PR #4 remains open/draft and GitHub reports it as not mergeable. No PR was merged and no deployment or runtime tests were performed.

**Step 38 result:** Identified which login changes to preserve during integration; actual Git-level synchronization remains blocked pending a Git-capable merge/rebase workflow.


## Step 39 — CI coverage and current-head status check

- Inspected `.github/workflows/static.yml`: it is a GitHub Pages deployment workflow triggered by pushes to `main` (plus manual dispatch), not a PR validation/test workflow.
- Queried combined commit status and PR-triggered workflow runs for the current Step 38 commit SHA; the connector returned no status entries and no PR workflow runs. This means there is no passing CI result verified for this commit; it does not prove the repository has no other external checks.
- PR #4 metadata now reflects Step 38 commit `314d46373d4089ee7db40cec44be1a259fd8d71a` as head, but remains open/draft and `mergeable: false`.
- A PR validation workflow should be added on the PR #3 base branch before expecting it to validate PR #4. This step documents the gap only; no workflow was added or executed.
- No merge, branch ref update, Firebase deployment, SMS test, Emulator test, or browser E2E test was performed.

**Step 39 result:** Current CI evidence is absent; existing Pages workflow is deployment-only and does not substitute for PR tests.
