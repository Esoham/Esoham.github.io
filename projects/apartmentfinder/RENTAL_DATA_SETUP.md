# Authorized rental listing data setup — RentCast

ApartmentFinder's Pages website is static, so it **must never call RentCast directly from the browser** or expose an API key in client-side files. A scheduled GitHub Actions workflow queries the official RentCast long-term rental API and publishes a minimal, sanitized JSON snapshot. A separate UI section shows provider data only when a recent authorized snapshot exists. The demo sample apartments remain separate.

## Provider and permission
- Provider: [RentCast rental listings API](https://developers.rentcast.io/reference/rental-listings-long-term)
- Data license: [RentCast API Terms](https://www.rentcast.io/terms-api) describe permitted use in consumer applications and public display, subject to the full agreement.
- Plan: RentCast's documented developer plan includes **50 free requests per month** with possible **overage fees**. Check the current plan and billing settings before enabling it.
- No API key is committed to Git. No custom scraping or data collected from Apartments.com.

## Activate the real provider feed (requires repository owner)
1. Open [RentCast's API dashboard](https://app.rentcast.io/app/api), create an account, review the terms, and select an appropriate subscription. Generate an API key.
2. In **Esoham/Esoham.github.io**, open **Settings → Secrets and variables → Actions → New repository secret**. Name it `RENTCAST_API_KEY`; paste the key there, never into a commit, issue, public chat, or browser JavaScript.
3. Open [GitHub Actions](https://github.com/Esoham/Esoham.github.io/actions/workflows/apartmentfinder-rental-refresh.yml), select **Run workflow**, and review the result. The job will make **five API requests** (one per predefined GA city) and commit only normalized records into `projects/apartmentfinder/data/live-listings.json`.
4. Verify the subsequent GitHub Pages deployment and open [ApartmentFinder](https://esoham.github.io/projects/apartmentfinder/). The **Authorized rental-data feed** section will show results if recent provider records were returned.
5. Check RentCast billing usage regularly. Each scheduled weekly run makes up to five requests (approximately 20–25 per month, before manual runs). Manual reruns count too. Disable the workflow or remove the secret if cost, quality or licensing becomes unsuitable.

## Quality and limitations
- Query: city + GA + `status=Active`, first 75 records per city, weekly schedule. Covers **Atlanta, College Park, East Point, Hapeville, Union City**, not all of Georgia or all available listings. Pagination beyond 75 records per city is intentionally not used to minimize API calls.
- Only records with valid positive listed rent, location, `Active` status and provider `lastSeenDate` within 14 days pass validation. An old or malformed snapshot is hidden from the website rather than portrayed as current.
- The site shows listed rent, address, bedrooms/baths/size if provided, last-seen date, and optional listing-office site. A listing-office website is **not necessarily an individual property advertisement**.
- A provider-reported active listing **is not proof that any individual apartment unit is available at this moment**. Rent and fees may change. RentCast does not supply all move-in costs, so the UI **does not invent** deposit, utility, administrative, or pet fees for provider records.
- The public JSON omits agent emails, phone numbers, account information, raw API responses and the API key. The source's displayed fields are sanitized and link destinations are HTTPS-only.
- If the API fails mid-refresh, the previous JSON is not overwritten. If old, the browser hides that snapshot. If the key is absent, no provider call occurs and the website points visitors to verified external marketplace searches instead.
- `node --test projects/apartmentfinder/tests/*.test.mjs` covers client-side filtering, state and freshness; `python -m unittest discover -s scripts -p 'test_sync_rentcast.py'` covers adapter field validation and failure cases without consuming API quota.
- The source site uses [Apartments.com College Park](https://www.apartments.com/college-park-ga/) and [Atlanta](https://www.apartments.com/atlanta-ga/) **outbound search links only**. It does not import or scrape Apartments.com results.

## Source layout
- `scripts/sync_rentcast.py`: outbound API call made only inside Actions with secret.
- `.github/workflows/apartmentfinder-rental-refresh.yml`: weekly + manual refresh.
- `projects/apartmentfinder/data/live-listings.json`: publicly cached, normalized snapshot; initial state `not_configured`.
- `projects/apartmentfinder/live-utils.mjs`: client-side freshness and filter checks.
- `projects/apartmentfinder/live.mjs`: isolated display layer; does not import fictional samples.

## Deployment state
**Having the integration code committed does not activate the API.** The repository owner must set `RENTCAST_API_KEY` and trigger a successful refresh. Until then, the site displays a status message and outbound marketplace links; no live listing data is represented as already connected.
