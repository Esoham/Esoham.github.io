# ApartmentFinder v1.0 — QA Test Plan

**Project:** Self-directed web development, quality engineering and security-hardening portfolio project  
**Release candidate:** v1.0 — awaiting verified CI and deployed-site acceptance  
**Platform:** GitHub Pages static rental research tool, RentCast sanitized snapshot, Node unit tests, Python adapter tests, Playwright Chromium desktop/mobile  
**Date:** 2026-11-07

## Objective and quality risks
Establish that renters can discover, inspect, save and compare provider-reported listings and estimate expenses without being misled about availability or fees, while protecting them from injected data, unsafe links and stale feeds.

Highest-priority risks: (1) false rental availability or room-vs-whole-home interpretation; (2) incorrect affordability calculations; (3) broken renter journeys; (4) unsafe external links or injected code; (5) stale/failed ingestion; (6) mobile accessibility and usability.

## Scope
**In:** real-record listing validation, city/ZIP/type/rent filters, planned-city empty states, room warnings, property dialogs, save/compare, budget calculator, feedback preparation, CSP and URL controls, CI, source snapshot refresh.

**Out:** actual lease applications, landlord identity verification, financial transactions, user accounts, verified rent/availability, payment security, penetration testing, private feedback backend.

## Test levels and techniques
- **Unit/functional:** JavaScript pure helpers, snapshot validity, filtering boundaries, calculator, shortlist limits, URL validation; Node `--test`.
- **Integration/contract:** Python mocked RentCast normalization and rotation, sanitation and failure safety; `unittest`; no API quota consumed.
- **E2E:** Playwright Chromium desktop and Pixel 7 emulation; search-to-detail, saved/compare, budgeting, feedback, negative feed states and XSS fixture.
- **Security/regression:** CSP and text-only DOM checks, link destination checks, dependency auditing, secret-exposure source checks.
- **Manual acceptance still required:** real-browser keyboard navigation, screen-reader usability, modal focus, browser console/CSP errors, zoom, responsive views, deployment parity, independent provider cross-checks.

## Entry criteria
1. Latest source changes committed.
2. No synthetic data substituted for missing provider results.
3. Stable test fixtures with no real user information or API secrets.
4. Dependency installation and automated jobs operable without exposing rental API keys.

## Exit / release gates
- Latest CI commit SHA and run URL verified; all Node, Python, Playwright desktop/mobile and dependency audit jobs pass.
- No open blocker or critical defects; major defects mitigated and explicitly documented.
- Manual production smoke test completed on both desktop and phone with screenshots or issue evidence.
- CSP has no unintended blocked resources; no uncaught browser errors.
- New five-city feed refresh confirmed separately; area-selection UI must not imply listing inventory when none exists.
- Rental source permission/licensing and user privacy disclosure reviewed.
- Accessibility checks and five to ten voluntary renter tests completed or release explicitly limited to an internal beta.

## Defect severity
- **Blocker:** entire search or application unusable, sensitive information exposure, payments or applications falsely represented.
- **Critical:** executable untrusted markup, major misleading rent/availability claims, broken access to all provider results.
- **Major:** key feature broken on supported viewport, incorrect cost math, dead end for a city with no listings.
- **Minor:** isolated display, copy or nonblocking interaction issue.
- **Cosmetic:** low-impact visual polish.

## Execution evidence procedure
Record commit SHA, workflow URL, date/time, environment, pass/fail/blocked status and failure artifact location. A test file existing in the repository is **not** evidence that its latest run passed.

**Run locally:**  
`node --test projects/apartmentfinder/tests/*.test.mjs`  
`python3 -m unittest discover -s scripts -p 'test_sync_rentcast.py' -v`  
`cd projects/apartmentfinder && npm install && npm audit --audit-level=high && npm run test:e2e`

Automated CI: [ApartmentFinder QA workflow](https://github.com/Esoham/Esoham.github.io/actions/workflows/apartmentfinder-qa.yml).  
Production: [ApartmentFinder](https://esoham.github.io/projects/apartmentfinder/).

## Status
**PLAN DOCUMENTED — NO FINAL RELEASE SIGN-OFF.** Latest deployed release, all CI results and accessibility checks require independent verification.
