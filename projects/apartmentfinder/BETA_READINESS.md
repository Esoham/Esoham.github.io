# ApartmentFinder · Atlanta renter beta readiness

## Product promise
Help renters find provider-reported options, understand advertised rents and *entered* move-in costs, and identify the questions to ask before applying. Never promise that a listing, fee, unit or lease is verified when it is not.

## Completed implementation
- RentCast provider snapshot and stale/inactive filtering, without exposing API credentials in frontend files.
- Real listing cards with city, rent, beds, baths, property type, provider last-seen date and clearly labeled uncertainty.
- Rental discovery excludes potentially room-like single-family one-bedroom records by default, showing a hidden-record count and allowing renters to opt in and inspect them. The filter is heuristic and does not certify other records as whole units.
- Search, ZIP/city/type filters, sorting, browser-only saved records and up-to-three real-rental comparison.
- On-site property details and renter-entered budget planning, including transportation, groceries, debt payments and other essentials; unknown fees are not guessed. The planner shows both housing costs and estimated cash remaining after entered living expenses.
- Pre-filled **public GitHub issue** route for listing concerns; requires GitHub sign-in and is not a private or in-app ticket system.
- On-site beta feedback form prepares and previews a report without a backend; users must explicitly copy or continue to GitHub to submit. No automatic submission is claimed.
- Node regression tests and Playwright desktop/mobile journeys via GitHub Actions.
- Automated **manual-review queue** for provider records with questionable rental scope, absent listing-office details, or long-running advertisements; the flags do not constitute independent verification.

## Required release gates before inviting real users
- [ ] Confirm latest `ApartmentFinder QA` run passes *after* the most recent commit. Previously passing tests do not establish later changes pass.
- [ ] Check GitHub Pages deployment for the same commit and manually verify real provider data on a phone and desktop.
- [ ] Verify the ApartmentFinder GitHub repository accepts Issues; the current form prepares feedback locally but cannot privately accept submissions. Add a privacy-preserving backend/form provider and data handling notice before broad launch.
- [ ] Review RentCast plan, attribution and permitted public display before advertising widely.
- [ ] Use the listing-quality report artifact to prioritize 10–20 provider-reported records, then check them against legitimate property offices or official listing sources. Record any stale, misleading or room-only rent anomalies. Do **not** contact tenants or collect their private information.
- [ ] Run accessibility checks: keyboard-only flows, modal focus, zoom, contrast, screen readers and narrow mobile devices.
- [ ] Publish plain-English privacy / contact / limitation notices before collecting renter feedback. Avoid collecting SSNs, lease applications, passwords or payment information.
- [ ] Recruit 5–10 opt-in Atlanta renters using [BETA_USABILITY_STUDY.md](./BETA_USABILITY_STUDY.md) for observed, voluntary usability sessions. Avoid storing their financial figures or addresses.
- [ ] Confirm the production site's error states when the rental feed is unavailable, stale or not configured.
- [ ] Check complete living-cost calculations on desktop and mobile, including negative remaining balance and missing expense fields. Ensure no advice implies rental approval.

## Renter beta exercise
1. Find a listing in a target city under a stated maximum monthly rent.
2. Open details and determine which data is verified vs. provider-reported.
3. Save two listings, compare them, and check missing fees.
4. Use the budget planner with sample numbers for rent, utilities, transportation, food and debts. Compare housing-only totals with overall monthly living costs, then identify questions to ask before applying.
5. Prepare an on-site beta feedback draft and confirm no report is silently submitted. To file the issue, GitHub sign-in is required.
6. Record outcome (completed or blocked), time, and confusing screens—not sensitive participant details.

## Success criteria for a limited beta
- No critical broken controls or misleading provider-status claims.
- At least 80% of volunteer testers complete search → details → compare → cost planning unaided.
- All critical reported data issues are investigated before broad public promotion.
- Errors, accessibility blockers and misleading data are prioritized over cosmetic features.

This is a beta checklist, **not** a claim that the platform is a licensed rental broker, property manager or application provider.
