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
