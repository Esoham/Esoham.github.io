# ApartmentFinder v1.0 — Requirements Traceability Matrix

A test mapping is evidence of **coverage**, not evidence that the test passed. Actual execution must be attached to the release record.

| ID | Requirement and acceptance behavior | Automated coverage | Manual check | Status |
| --- | --- | --- | --- | --- |
| AF-01 | Display only fresh active provider records; never mix with fictional examples | `tests/live-utils.test.mjs` freshness/validation; `e2e/resilience.spec.mjs` stale feed | Confirm snapshot timestamp and displayed city | Code covered; run unverified |
| AF-02 | City, ZIP, property type, max rent and bedroom filters return matching records | `tests/live-utils.test.mjs` filters; `e2e/renter-journey.spec.mjs` city/rent/reset | Search 2 cities, edge values and ZIP | Code covered; run unverified |
| AF-03 | Ten planned cities selectable; missing data clearly identified | `e2e/renter-journey.spec.mjs` ten metro areas / empty states | Select Sandy Springs and Forest Park without feed data | Code covered; run unverified |
| AF-04 | Suspicious room-like rentals excluded by default, with override and source notes | `e2e/renter-journey.spec.mjs` ambiguity, reset, sourced room; `tests/listing-research.test.mjs` | Validate descriptions against original sources | Code covered; listings not independently availability-verified |
| AF-05 | Property details and clickable address/price; no fabricated fees | `e2e/renter-journey.spec.mjs` detail, click actions and caveats | Desktop/mobile modal + external map | Code covered; run unverified |
| AF-06 | Saved properties stored locally and saved-only filter works | `e2e/renter-journey.spec.mjs` save/filter | Reload and shared-device privacy notice | Code covered; run unverified |
| AF-07 | Compare up to 3 real rentals, handle selection limit and missing values | `tests/live-utils.test.mjs` comparison; `e2e/renter-journey.spec.mjs` compare | Check fees remain unknown | Code covered; run unverified |
| AF-08 | Correct monthly, move-in and full cost-of-living estimates | `tests/live-utils.test.mjs` budget tests; `e2e/renter-journey.spec.mjs` cost planner | Verify negative balance and user-entered sample numbers | Code covered; run unverified |
| AF-09 | Feedback remains a local draft until explicit public GitHub action | `e2e/renter-journey.spec.mjs` feedback lifecycle | Verify issue submission route and public-data warning | Code covered; GitHub Issues destination unverified |
| AF-10 | Missing, stale or failed feed does not strand renter | `e2e/resilience.spec.mjs` error-state tests | Test production feed failure and fallback | Code covered; run unverified |
| AF-11 | Provider strings cannot execute HTML/JS in the client | `tests/security.test.mjs`; `e2e/resilience.spec.mjs` malicious markup | Inspect production console and CSP enforcement | Code covered; run unverified |
| AF-12 | External links HTTPS and safe; browser CSP restricts injection | `tests/security.test.mjs`; `scripts/test_sync_rentcast.py` URL tests | Review origin/target and false sense of identity verification | Code covered; run unverified |
| AF-13 | CI validates unit, integration, E2E and dependency advisories | `.github/workflows/apartmentfinder-qa.yml`, Dependabot | Confirm SHA/run and inspect failed jobs | Configured; outcome unverified |
| AF-14 | Weekly authorized feed rotates city groups and rejects invalid records | `scripts/test_sync_rentcast.py` | Confirm scheduled refresh and provider API usage | Mocked adapter covered; real expansion unverified |
| AF-15 | Mobile navigation and common views usable without horizontal overflow | `e2e/renter-journey.spec.mjs` mobile/nav/overflow | Keyboard, zoom, screen reader and device check | Partial automated coverage; accessibility sign-off pending |

## Traceable bug record format
Each bug report should reference requirement ID, reproduction environment, sanitized fixtures, steps, expected/actual result, severity, screenshot or trace if appropriate, fix commit and regression test.

## Product integrity
A passing test never establishes independent unit availability, lawful landlord ownership, rental safety, provider compliance or the security of third-party destinations.
