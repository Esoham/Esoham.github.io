# ApartmentFinder v1.0 — security hardening review

**Scope:** Public GitHub Pages rental-search client, scheduled RentCast ingestion, CI tests and public feedback workflow. This is a source-based hardening pass, **not** a penetration test, production audit, or certification.

## Trust boundaries / attack surfaces

| Boundary | Risk | Current control |
| --- | --- | --- |
| RentCast API → GitHub Actions | API credential leakage and tampered rental fields | Secret provided through Actions environment only; minimal sanitized JSON; no raw API response committed |
| Public JSON → browser | Malicious provider text or URL, stale/misleading data | DOM textContent instead of HTML injection, data-shape + freshness checks, HTTPS-only external links with unsafe destination rejection |
| Browser → external websites | Phishing / tabnabbing and misleading affiliation | Links open with noopener + noreferrer, external sites identified as independent, direct property availability not claimed |
| Browser-local saved properties | Exposure on shared devices | Only listing IDs stored in localStorage; no user credentials or financial calculator entries stored |
| Feedback → GitHub public issues | Users inadvertently disclose personal information | Explicit public-submission warning; local drafting only; no silent submission or private data collection claimed |
| Third-party QA dependencies | Supply-chain vulnerabilities | Dependabot weekly update checks, GitHub Actions audit gate for high/critical npm advisories |
| GitHub Actions → repository write | Excessive CI permissions | QA has read-only access; rental refresh alone has contents:write to update sanitized snapshots |
| Static website → browser | Cross-site scripting and uncontrolled resource loading | Restrictive CSP meta tag: self-hosted scripts, styles, connections; no inline script/eval or external remote fonts; disallow form submission |

## Changes made

1. Added Content Security Policy meta tag. No unsafe-inline or unsafe-eval.
2. Added restrictive referrer policy.
3. Rejected credential-bearing, non-HTTPS, local or private-network-style office destinations in frontend and ingestion.
4. Added Node security regression tests and Python URL validation tests.
5. Added npm advisory audit in browser CI (high/critical failures block pass).
6. Enabled weekly Dependabot for npm and GitHub Actions.
7. Reduced QA artifact retention to seven days and limited repository write permissions to refresh job.

## Known limitations / actions requiring the repository owner

- [ ] Verify latest GitHub Actions run and Playwright desktop/mobile tests; this source audit does **not** establish that those passed.
- [ ] Inspect security audit output; update or pin vulnerable dependencies if audit fails.
- [ ] Enable GitHub secret scanning and push protection where available; confirm no historical credential leaks. A source review cannot scan Git history, external logs or account secrets.
- [ ] Turn on two-factor authentication/passkeys, protect the default branch, require passing CI and review before merging when practical.
- [ ] Verify the external rental provider's data-display license and API quota.
- [ ] Review any user-provided listing-office domains before presenting them as trusted representatives. HTTPS **does not** prove legitimacy. Do not auto-login or send user data to provider sites.
- [ ] Check CSP behavior, browser console and network requests on the deployed GitHub Pages site. The meta policy cannot supply HTTP-only defenses such as HSTS, X-Content-Type-Options or frame-ancestors. If deploying behind a controlled host/CDN, set appropriate HTTP headers there and test them.
- [ ] Establish a private vulnerability-reporting route before inviting public users. A publicly visible GitHub Issue is **not suitable for sharing exploit details or sensitive data**. If available, enable GitHub private vulnerability reporting.
- [ ] Run accessibility, privacy and manual threat-driven browser tests; no penetration testing has been performed.
- [ ] Consider a non-public feedback destination with data retention/privacy practices if this becomes a commercial product.

## Risk acceptance for current beta

The application remains an unauthenticated, read-only rental-research prototype with no financial transactions or actual rental applications. Its security posture must be reassessed before adding accounts, payments, forms that send sensitive data, or integrations with landlords and property managers.

## Future Providence Meridian use

Do **not** copy ApartmentFinder's trust model unchanged into a B2B sourcing system. Customer accounts, RFQs, invoices, price lists and supplier integrations would require server-side authentication, authorization (least privilege), CSRF protections where applicable, a protected database, secrets management, audit logs, backup/restore validation, and a proper security incident process.
