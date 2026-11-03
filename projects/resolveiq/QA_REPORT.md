# ResolveIQ — QA evidence log

**Product owner:** Esoham Abalo  
**Release:** v0.2 — QA in progress

## 2026-11-03: Initial manual smoke test
**Evidence source:** Product-owner-reported smoke test.  
**Environment:** Public GitHub Pages demo; browser/version not recorded.  
**Result:** Product owner confirmed that the application loads and allows interaction with records.  
**Scope:** Basic smoke test only; individual scenarios remain unverified.

## Automated tests
Seven unit tests committed in `priority-engine.test.mjs`. GitHub Actions workflow configured in `.github/workflows/product-tests.yml`. **Passing CI status not independently verified** at the time of this log.

## v0.2 QA matrix
| Case | Expected | Status |
|---|---|---|
| App loads | Ticket queue renders | Pass (owner-reported) |
| Record interaction | Ticket details can be opened | Pass (owner-reported, broad) |
| Priority ordering | Highest score first | Automated test committed; execution unverified |
| Assignment | Owner can be selected and saved | Not verified |
| Notes | Notes persist after refresh | Not verified |
| Search + filter | Combined filter works | Not verified |
| Reset | Clears local changes | Not verified |
| Keyboard-only flow | All actions reachable | Not verified |
| Mobile layout | No clipped critical actions | Not verified |

## Next
Check CI, run each manual case, record actual results and defects, then prioritize and document improvements. Synthetic data only; no claim of customer adoption.
