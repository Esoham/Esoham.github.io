# ApartmentFinder v1.0 — Release Verification Record

**Verification date:** 2026-11-07  
**Decision:** NOT APPROVED for unrestricted public launch; source-side QA documentation is prepared.

## Evidence available
- GitHub repository provides Node unit tests, Python RentCast contract tests, Playwright Chromium desktop/mobile tests, static CSP and security regression tests.
- GitHub Actions workflow configured for source checks, audits, browser testing and uploads of failure artifacts.
- The application contains clear warnings about provider-reported rental data and unknown expenses.

## What was actually verified during this review
- Relevant source and test files exist on the connected GitHub repository.
- Tests were mapped to 15 product/security requirements.
- An attempt to open the deployed website and GitHub Actions run using a web retrieval tool did **not** yield an accessible rendered result.
- GitHub combined-status lookup for the known security commit returned **no statuses**, which is inconclusive, not a pass or failure.

## Execution ledger — complete only from real run evidence
| Check | Result | Evidence |
| --- | --- | --- |
| Node functional/security tests | Not verified | Check current GitHub Actions run |
| Python RentCast contract tests | Not verified | Check current GitHub Actions run |
| Playwright desktop Chromium | Not verified | Check current GitHub Actions run |
| Playwright Pixel 7 mobile emulation | Not verified | Check current GitHub Actions run |
| npm high/critical advisory audit | Not verified | Check current GitHub Actions run |
| Production site matches latest commit | Not verified | Compare deploy run SHA and browser code |
| CSP browser console and blocked requests | Not verified | Desktop DevTools evidence |
| Ten-city selector and honest empty-state copy | Source present; deployment not verified | Production smoke test |
| RentCast refreshed five new cities | Not verified | Rental refresh workflow and JSON coverage |
| Accessibility focus, zoom and screen reader | Not verified | Manual assessment |
| Privacy and provider attribution review | Not verified | Owner review |

## Manual smoke test — record findings
1. Load the deployed site in private browsing, both desktop and mobile. Record time, console errors and exact URL.
2. Click all primary-navigation items; tab with keyboard from skip link to last interactive control.
3. Search Atlanta; change rent and bedrooms; reset filters. Select Forest Park and Sandy Springs; absence of provider records must be communicated clearly.
4. Open listing via address, price and View Details; use Escape and close button; check focus returns logically.
5. Save, compare two rentals, remove one and recalculate renter living costs.
6. Verify no implied approval, fees or confirmed availability. Confirm scope warning for room-like records.
7. Try invalid or stale mocked feed **only in tests**; do not alter the public provider snapshot.
8. Confirm public feedback requires explicit user action and states that reports are publicly visible.
9. Inspect Network tab: no RentCast key in browser requests, and external links open securely.
10. Check mobile 320px viewport, 200% zoom and a screen reader. Capture only non-sensitive screenshots.

## Release decision rule
Sign off only after recording actual run URL/commit, results, risk acceptance, accessibility status and independent provider data checks. **Do not report a completed deployment test solely because the code or test suite exists.**

## Security and data caveats
See [SECURITY_REVIEW.md](./SECURITY_REVIEW.md), [QA_TEST_PLAN.md](./QA_TEST_PLAN.md) and [BETA_READINESS.md](./BETA_READINESS.md). GitHub Pages' meta CSP is not equivalent to all HTTP response headers. RentCast's `Active` status is not guaranteed current unit availability.
