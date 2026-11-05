# DOJO WALK Website — AI Contributor Instructions

## Project scope
This repository contains the public DOJO WALK website. Its README describes a static HTML/CSS site with a small vanilla JavaScript snippet and no external runtime library dependencies. Firebase Hosting serves the repository root.

## Required workflow
1. Read the relevant HTML, CSS, JavaScript, README, and existing GitHub Actions checks before editing.
2. Keep the site responsive and accessible: semantic landmarks, keyboard focus, labels, reduced-motion support, and mobile navigation must remain intact.
3. Do not introduce a frontend framework, external runtime dependency, analytics, trackers, or third-party form service without explicit approval.
4. Run the existing static validation and customer-auth integration checks where relevant. Test key pages and links on mobile and desktop; report checks that could not be run.
5. Preserve the distinction between preview content and live backend functionality.

## Product, privacy, and launch constraints
- Do not claim that booking, payment, live GPS tracking, login, support channels, or enquiry submission work unless the corresponding backend integration has been implemented and verified.
- Contact enquiry buttons must remain disabled until a secure, tested HTTPS backend endpoint exists.
- Do not publish unverified contact details, service areas, prices, legal policies, or operational claims.
- Never place API keys, mail credentials, service-account JSON, customer submissions, or private data in browser code or the repository.
- Treat privacy, terms, and cancellation/refund pages as drafts until reviewed and approved.

## Deployment boundaries
Do not run Firebase Hosting deployment, change Hosting targets/domains, or modify deployment secrets without explicit owner approval.

## Pull requests
Work on a feature branch, never directly on `main`. Include pages changed, accessibility/responsive checks, screenshots when useful, validation results, and rollback notes. Merge and production deployment require owner approval.


## Mandatory DOJO WALK engineering operating rules (Notion-aligned)

Follow the Notion AI Engineering Control Center and Four Team AI Coding Instructions. Central Task Register: https://app.notion.com/p/2f476768c6f14aec9e70bf04afd83df8

Before editing, inspect the assigned task and linked spec, this repository's source and instructions, working tree, active branch, recent commits and open PRs. Record task ID, branch, current commit SHA, scope, acceptance criteria, dependencies and test plan. Continue the exact active task branch; do not create a new branch merely because a chat/session changed. Check for duplicate work first. If a required decision or contract is missing, stop and report BLOCKED.

Keep the smallest safe scope. Do not silently change product policy, API/data contracts, schema, permissions, security rules or payment behavior. Team 01 owns shared backend contracts; notify affected client teams before contract changes. Never force-push, delete branches, close historical PRs or overwrite unmerged work without explicit approval.

Run relevant checks and record exact commands/workflows, timestamps, results and exact commit SHA tested. Use PASS only for checks that passed; FAIL for failures; NOT RUN for checks not executed. PRs and handoffs must include task ID, scope, risk, affected repositories, branch, PR, SHA, contract/schema version where relevant, test evidence, blockers and rollback notes.

Obtain independent review for security, permissions, payment, KYC, GPS/location and migration changes. Do not weaken authentication or security Rules to make tests pass. Production Rules, Storage Rules, Functions, secrets, destructive migrations and production data writes require explicit authorization. Merge/deploy only after required human approval. A green CI result applies only to checks run on that exact SHA and is not blanket production approval.

Do not introduce coupon or cash-payment flows. Protect KYC, selfies, customer data, GPS/location history, payment records and credentials. Do not mark work complete until acceptance criteria, test evidence, review/approval and PR/release state are accurately recorded.

## Team ownership
Website delivery is coordinated by Team 02 alongside Admin, but this repository retains its own CI and release pipeline. Website is not a fifth developer team. Keep public content separate from privileged Admin logic and secrets; do not change DNS, hosting targets or production deployment without explicit approval.
