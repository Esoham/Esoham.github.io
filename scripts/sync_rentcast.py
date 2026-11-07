"""Fetch permitted rental listing data from RentCast into a public, sanitized Pages snapshot.

IMPORTANT: Requires RENTCAST_API_KEY in GitHub Actions Secrets. Never commit API keys.
No API requests are made unless the refresh workflow is manually dispatched or
runs on its weekly schedule. Keep the caller's quota and overage pricing in mind.
"""
from __future__ import annotations

import datetime as dt
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

API_URL = "https://api.rentcast.io/v1/listings/rental/long-term"
OUTPUT = Path(__file__).resolve().parents[1] / "projects/apartmentfinder/data/live-listings.json"
CITIES = ("Atlanta", "College Park", "East Point", "Hapeville", "Union City")
MAX_RESULTS_PER_CITY = 75
MAX_AGE_DAYS = 14
MAX_RENT = 6000  # Excludes non-rental or implausibly high records, not a user budget.

def parse_date(value):
    if not isinstance(value, str) or len(value) > 40:
        return None
    try:
        return dt.datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(dt.timezone.utc)
    except (TypeError, ValueError, OverflowError):
        return None

def safe_website(value):
    if not isinstance(value, str) or len(value) > 400:
        return None
    parsed = urllib.parse.urlsplit(value)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        return None
    return value

def safe_text(value, max_length=180):
    if not isinstance(value, str):
        return ""
    return "".join(char for char in value if char.isprintable()).strip()[:max_length]

def normalize_record(raw, now):
    """Reject listings with invalid, missing, old, or inconsistent provider data."""
    if not isinstance(raw, dict) or raw.get("status") != "Active":
        return None
    last_seen = parse_date(raw.get("lastSeenDate"))
    if last_seen is None or not dt.timedelta(0) <= now - last_seen <= dt.timedelta(days=MAX_AGE_DAYS):
        return None
    rent = raw.get("price")
    if isinstance(rent, bool) or not isinstance(rent, (int, float)) or not 100 <= rent <= MAX_RENT:
        return None
    beds = raw.get("bedrooms")
    if isinstance(beds, bool) or not isinstance(beds, (int, float)) or beds < 0 or beds > 20:
        beds = None
    baths = raw.get("bathrooms")
    if isinstance(baths, bool) or not isinstance(baths, (int, float)) or baths < 0 or baths > 20:
        baths = None
    size = raw.get("squareFootage")
    if isinstance(size, bool) or not isinstance(size, (int, float)) or size <= 0 or size > 100000:
        size = None
    source_id = safe_text(raw.get("id"), 180)
    address = safe_text(raw.get("formattedAddress"), 210)
    city = safe_text(raw.get("city"), 60)
    zip_code = safe_text(raw.get("zipCode"), 10)
    if not source_id or not address or not city or raw.get("state") != "GA":
        return None
    office = raw.get("listingOffice") if isinstance(raw.get("listingOffice"), dict) else {}
    agent = raw.get("listingAgent") if isinstance(raw.get("listingAgent"), dict) else {}
    link = safe_website(office.get("website")) or safe_website(agent.get("website"))
    return {
        "id": source_id,
        "address": address,
        "city": city,
        "state": "GA",
        "zip": zip_code,
        "rent": round(float(rent), 2),
        "beds": beds,
        "baths": baths,
        "sqft": size,
        "propertyType": safe_text(raw.get("propertyType"), 50),
        "lastSeenDate": raw.get("lastSeenDate"),
        "listedDate": raw.get("listedDate") if parse_date(raw.get("listedDate")) else None,
        "officeName": safe_text(office.get("name"), 120),
        "officeWebsite": link,
        "status": "Active"
    }

def rentcast_request(city, api_key):
    params = urllib.parse.urlencode({
        "city": city, "state": "GA", "status": "Active", "limit": MAX_RESULTS_PER_CITY
    })
    request = urllib.request.Request(
        API_URL + "?" + params,
        headers={"X-Api-Key": api_key, "Accept": "application/json",
                 "User-Agent": "ApartmentFinderPortfolio/1.0"}
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        if response.status != 200:
            raise RuntimeError("RentCast returned unexpected HTTP status " + str(response.status))
        body = response.read(3_000_001)
        if len(body) > 3_000_000:
            raise RuntimeError("Provider response exceeds size limit")
        data = json.loads(body)
        if not isinstance(data, list):
            raise RuntimeError("Unexpected RentCast response type")
        return data

def build_snapshot(api_key, now=None, fetch=rentcast_request):
    if not api_key:
        raise ValueError("RENTCAST_API_KEY is required")
    now = now or dt.datetime.now(dt.timezone.utc)
    unique = {}
    for city in CITIES:  # Exactly five provider calls per run.
        records = fetch(city, api_key)
        for raw in records:
            normalized = normalize_record(raw, now)
            if normalized is None:
                continue
            # Dedupe across city boundary queries; freshest listing wins.
            previous = unique.get(normalized["id"])
            if previous is None or parse_date(normalized["lastSeenDate"]) > parse_date(previous["lastSeenDate"]):
                unique[normalized["id"]] = normalized
    return {
        "provider": "RentCast",
        "status": "ready",
        "retrievedAt": now.isoformat().replace("+00:00", "Z"),
        "lastSeenMaxAgeDays": MAX_AGE_DAYS,
        "queryCities": list(CITIES),
        "notice": "Provider-reported active rentals, not verified unit availability. Rents and fees may change; confirm with the leasing contact.",
        "items": sorted(unique.values(), key=lambda item: (item["rent"], item["city"], item["id"]))
    }

def main():
    key = os.environ.get("RENTCAST_API_KEY", "").strip()
    if not key:
        print("RENTCAST_API_KEY missing; no API requests made. Add GitHub Actions secret to activate.")
        return 2
    try:
        snapshot = build_snapshot(key)
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        temp = OUTPUT.with_suffix(".tmp")
        temp.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        temp.replace(OUTPUT)
        print(f"Updated normalized rental snapshot: {len(snapshot['items'])} provider-reported active records from {len(CITIES)} city queries.")
        return 0
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError, RuntimeError) as exc:
        # Do not log API key or third-party raw response bodies.
        print("Rental refresh failed; previous snapshot was not overwritten. Check provider account, quota and connectivity.", file=sys.stderr)
        print(type(exc).__name__, file=sys.stderr)
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
