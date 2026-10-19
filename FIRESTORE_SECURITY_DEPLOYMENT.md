# Firestore Security Rules — Deployment Checklist

## Current status

- `firestore.rules` is a draft ruleset on the `feature/website-customer-profile-firestore` branch.
- `firebase.json` points the Firebase CLI to that file.
- The rules have been statically reviewed only. They have **not** been deployed or tested in the Firebase Emulator.
- Do not treat this draft as production-ready.

## Important shared-project warning

Firestore Security Rules apply to the whole Firestore database, not only this website. The current draft explicitly denies access to every collection other than `users/{userId}`. Deploying it as-is could break the DOJO WALK customer app, partner app, admin portal, or other existing data flows. No deployment should happen until the existing collection schema and access needs are audited and a complete shared ruleset is reviewed.

## Safe next steps

1. Confirm the Firebase project and Firestore database that the website should use.
2. Export or copy the currently deployed Firestore rules from Firebase Console before changing anything.
3. Audit all existing collections and clients that use this project, including customer, partner, and admin access requirements.
4. Merge those requirements into one ruleset. Keep each user's private data owner-scoped and grant privileged access only through explicitly designed, trusted roles.
5. Add Firebase Emulator tests for unauthenticated reads/writes, cross-user access, valid profile create/update, invalid age, mismatched phone number, field tampering, and existing application flows.
6. Review the final diff with the project owner before deployment.
7. Deploy only the reviewed rules using Firebase CLI from a trusted development environment:
   `firebase deploy --only firestore:rules --project dojo-platform-b68a3`
8. Verify the deployed rules and run smoke tests for all dependent applications.

## Do not commit credentials

Never put service-account JSON, private keys, passwords, or access tokens in this repository. Use an authenticated Firebase CLI session or a securely configured CI secret.


## Emulator test matrix (required before production)

Use the Firebase Emulator Suite against a disposable test database. These are required cases, not claims that tests have already run.

| Case | Setup / action | Expected result |
|---|---|---|
| Unauthenticated read | No signed-in user reads `users/A` | Denied |
| Unauthenticated create | No signed-in user creates `users/A` | Denied |
| Owner read | Auth UID A reads `users/A` | Allowed when document/rules conditions are satisfied |
| Cross-user read | Auth UID A reads `users/B` | Denied |
| Cross-user create/update | Auth UID A creates or updates `users/B` | Denied |
| Valid profile create | UID, Auth phone claim, required fields, timestamps and allowed values match | Allowed |
| Phone claim mismatch | Stored `phoneNumber` differs from Auth token claim | Denied |
| Invalid age type/range | Age is a string, below 18, or above 120 | Denied |
| DOB/age mismatch | DOB indicates under 18 while age field claims 18+ (and reverse) | Must be denied by the final enforcement design; current rules do not independently calculate age from DOB, so this case is a known gap |
| Protected timestamp | Existing valid `createdAt` is changed on update | Denied |
| Unexpected field | Create includes an unmanaged field, or update changes an unmanaged field | Denied by the profile rule's allowlist |
| Delete own profile | Owner deletes `users/A` | Denied |
| Other collection | Customer app, partner app, and admin app access their legitimate test documents under the final shared ruleset | Expected result must be defined per audited role/collection; current catch-all draft denies all of these |

Record each test's actual result, emulator version, rules commit SHA, and date in the release evidence. Do not mark this matrix passed until the Emulator Suite has actually run. Before release, add the corresponding tests to the repository's automated test workflow.
