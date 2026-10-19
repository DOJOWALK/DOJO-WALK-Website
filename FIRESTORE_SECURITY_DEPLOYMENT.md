# Firestore Security Rules — Deployment Gate

## Current decision (2026-10-19)

**BLOCKED — do not deploy Firestore rules from this website repository.** The previously reviewed Website-only draft `firestore.rules` and its `firebase.json` deployment pointer were removed from the profile feature branch before promotion because that ruleset denied all collections other than the user's own top-level profile. It was not a complete shared DOJO WALK ruleset.

No deployed rules export was available during this source review. Therefore the live rules state is **UNKNOWN**, not PASS or FAIL. Removing a draft file from GitHub does not change the rules already deployed in Firebase.

## Required prerequisites before any rules release

1. An authorized project operator must export the currently deployed rules from the correct Firebase project `dojo-platform-b68a3`.
2. Inventory the canonical collection schema and legitimate access paths for Customer, Partner, Admin, bookings, pets, addresses, zones/service locations, payments, coupons, and audit records.
3. Produce one shared candidate ruleset with explicit owner and trusted-role access. Do not treat client-supplied role, age, or profile fields as trusted authorization by themselves.
4. Configure Firestore Emulator tests for positive and negative cases, including cross-user reads/writes, profile create/update, nested pets/addresses, booking creation and lifecycle, walker actions, admin-only access, and denial of unauthorized collections.
5. Run the Emulator test suite and record the exact candidate commit, test results, and reviewer approval.
6. Confirm Phone Auth settings and authorized domains separately; Emulator rules tests do not verify live SMS OTP.
7. Deploy only after the complete shared ruleset and tests have been approved by the project owner.

## Verification status

| Item | Status |
|---|---|
| Current deployed Firestore rules exported | NOT VERIFIED |
| Shared schema agreed | NOT COMPLETE |
| Shared candidate ruleset reviewed | NO |
| Emulator tests executed | NOT RUN |
| Live Phone OTP and browser E2E | NOT RUN |
| Safe to deploy rules | NO |

This document is a release gate, not an instruction to deploy. Do not run `firebase deploy --only firestore:rules` until all prerequisites above pass.
