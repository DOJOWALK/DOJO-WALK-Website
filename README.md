# DOJO WALK Website

Public company website for DOJO WALK, the dog-walking service within Dojo Platform.

## Website structure

1. **Home** — brand introduction and primary calls to action.
2. **Company** — platform purpose and customer/partner/operations principles.
3. **Services** — Walk Now (one-time), Regular Walk, and Customize (selected-date walks).
4. **Customer journey** — sign in, add dog and address, select schedule, follow booking status.
5. **Safety & trust** — intended partner onboarding, pet-care instructions, supported walk updates, and support principles.
6. **For walking partners** — planned onboarding, service-area selection, assignments, and walk completion.
7. **Operations flow** — service locations, service readiness, booking and partner coordination, completion and support.
8. **Service areas** — availability is controlled by approved operational setup.
9. **FAQs, get started, contact, and footer** — clear launch-state information.

## Technology

- Static HTML, CSS, and a small vanilla JavaScript snippet.
- Responsive layout for mobile and desktop.
- No external JavaScript libraries or runtime service dependencies.

## Local preview

Open `index.html` in a browser. For a local HTTP preview, run a static web server from the repository root.

## Before public launch

- Confirm and publish official support email, phone and business address as appropriate.
- Publish reviewed Privacy Policy, Terms & Conditions, Cancellation/Refund Policy and other applicable notices.
- Connect booking and partner CTAs only after the corresponding production flows are available.
- Confirm live service areas, prices, service terms and operational claims with the admin configuration.
- Test all links and layout on mobile and desktop.
- Configure the custom domain in Firebase Hosting when the domain is owned.
- For GitHub Actions deployment, add the repository Actions secret `FIREBASE_SERVICE_ACCOUNT_DOJO_WALK` containing a Firebase service-account JSON authorized to deploy Hosting to project `dojo-platform-b68a3`.
- The Firebase Hosting target `dojowalk` is mapped to the site ID `dojowalk`; verify the site ID in Firebase Console before merging.

**Important:** This website describes the intended service and product flow. It does not claim that bookings, live tracking, partner applications, support channels or all listed operational features are currently live.


## Interactive website features

- Accessible mobile navigation menu with expanded/collapsed state.
- Lightweight CSS 3D-inspired hero card and pointer tilt on compatible desktop devices.
- Scroll reveal transitions with reduced-motion support.
- Back-to-top control.
- Open Graph and search-engine metadata.
- Visible keyboard focus styles and semantic navigation landmarks.

These are front-end interactions only. Live booking, payment, contact submissions, location checking, partner applications, account login, analytics and live walk tracking require real backend/service integrations and are not simulated as working features.


## Legal and policy page starters

- `privacy.html` — privacy notice starter.
- `terms.html` — website terms starter.
- `cancellation-refund.html` — cancellation and refund policy starter.

These are explicitly marked as drafts. They must be reviewed and completed with the verified operating entity, actual data practices, approved service terms, official support details and applicable legal requirements before being treated as final or enabling live transactions.


## Contact enquiry form previews

- Customer enquiry form fields and walker partner enquiry form fields are laid out with labels and input limits.
- Submission controls are intentionally disabled until a secure backend endpoint is configured.
- The forms do not send or store submissions. Do not collect real personal information with this preview.
- Before launch, add server-side validation, spam protection/rate limiting, privacy notice alignment, secure routing to the operations team, and a clear success/error state after confirmed server response.

## Secure contact backend contract (not connected yet)

The public website is static HTML, so it must not send enquiries directly to a mail provider using a secret key or write untrusted submissions straight into an admin database. Keep both form buttons disabled until a real HTTPS endpoint is deployed and tested.

### Suggested endpoint

- Method: `POST`
- Path: `/api/enquiries` (final URL is supplied by the deployed backend)
- Request content type: `application/json`
- Allowed enquiry types: `customer` and `walker_partner`
- Expected fields:
  - Customer: `type`, `name`, `contact`, `topic`, `message`
  - Walker partner: `type`, `name`, `contact`, `city`, `area`, optional `message`
- Successful response: HTTP `201` with a non-sensitive confirmation such as `{"ok":true,"reference":"..."}`.
- Invalid request: HTTP `400`; rate-limited request: HTTP `429`; unexpected failure: generic HTTP `500` response without internal details.

### Required server-side safeguards

1. Validate the enquiry type and every field on the server; enforce the same or stricter length limits as the UI.
2. Normalize and trim text, reject empty required fields, and safely encode text when displaying it later.
3. Apply per-IP and per-contact rate limits, a honeypot or equivalent bot check, and server-side spam detection.
4. Enforce HTTPS and a strict CORS allowlist for the actual production website origin. CORS is not authentication and is not a spam defence by itself.
5. Keep mail-provider credentials and any admin/database secrets only in server environment variables or a secrets manager. Never commit secrets or embed them in browser JavaScript.
6. Route submissions only to a verified operations inbox or private admin system; do not expose submissions in a public repository, public issue, or client-readable collection.
7. Collect only necessary information, set a retention/deletion policy, restrict staff access, and align the privacy notice with actual processing before launch.
8. Return a clear success message only after the server confirms acceptance. On network/server errors, show a retry message and do not claim that the enquiry was delivered.
9. Test valid requests, invalid/missing fields, oversized input, spam/rate limiting, CORS rejection, server errors, mobile use, and keyboard accessibility before enabling the form.

### Activation checklist

- [ ] Choose and deploy the backend host/runtime.
- [ ] Configure the real endpoint URL and verified recipient privately.
- [ ] Add server validation, rate limiting, spam controls and monitoring.
- [ ] Test end-to-end without using real customer personal data.
- [ ] Update the front end to submit only to that endpoint and show server-confirmed status.
- [ ] Update and review the privacy notice, then enable the submit controls.

**Current state:** this is an implementation contract only. No backend endpoint, recipient, email delivery, database storage, or live submission has been configured.

