# ApartmentFinder v1.0 — Defect Log

## AF-SEC-001 — Valid HTTPS office links were incorrectly rejected

- **Severity:** Major (renter cannot access a legitimate external office website)
- **Area:** Provider office-link validation; `live-utils.mjs`
- **Detected:** 2026-11-07 during final source-level release verification
- **Status:** Fixed in source; full browser CI regression result unverified
- **Type:** Regression / validation logic error
- **Cause:** A control-character regex was double-escaped in source. It matched ordinary characters within valid HTTPS URLs, so `trustedOfficeUrl` returned `null` for permitted destinations.
- **Expected:** `https://leasing.example.org/units` is accepted, while schemes such as `javascript:`, localhost/IP literals, credentials, and newline characters are rejected.
- **Observed before fix:** An isolated helper execution exposed unexpected rejection of apparently valid links. The first helper harness also lacked the runtime's built-in `URL` implementation, so further checking separated the regex issue from this harness limitation.
- **Correction:** Changed double-escaped regex escapes to real control-character range escapes in `live-utils.mjs`.
- **Evidence:** [Fix commit fa3b436](https://github.com/Esoham/Esoham.github.io/commit/fa3b436b27a4ceb7f56b0844892930cd7d546c0c); security regression test in `tests/security.test.mjs`.
- **Retest:** The corrected regex was independently checked against ordinary HTTPS text and newline characters. Twenty-two JavaScript helper assertions passed in a lightweight, browser-independent harness with a URL shim. **Official Node, Playwright, deployed-browser, and GitHub Actions runs are still unverified.**

## General issue workflow
Each future defect should include requirement ID, expected/actual behavior, minimal steps with synthetic data, severity, impact, fix commit, test name, retest environment, and final disposition. Never include renter financial information, names or API credentials in public issues.

**Note:** This log describes a genuine source defect and its correction; it is not a fabricated production outage or end-user incident.
