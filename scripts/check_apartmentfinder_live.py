"""Read-only deployment smoke check for ApartmentFinder on GitHub Pages.

This verifies public HTTP delivery and basic deployment structure. It does NOT
confirm that a property is available, that a browser E2E run passes, or that
the underlying commit matches GitHub Actions without comparing SHA evidence.
Run only in a network-enabled environment, such as GitHub Actions.
"""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from html.parser import HTMLParser
from urllib.parse import urljoin

BASE = "https://esoham.github.io/projects/apartmentfinder/"
TIMEOUT = 20


def fetch(path: str):
    url = urljoin(BASE, path)
    req = urllib.request.Request(
        url, headers={"User-Agent": "ApartmentFinderReleaseSmoke/1.0"}
    )
    with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
        data = response.read(5_000_001)
        if len(data) > 5_000_000:
            raise RuntimeError(f"Response too large: {path}")
        return data.decode("utf-8"), response.status


class DocumentInspector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.csp = ""
        self.scripts = []
        self.styles = []

    def handle_starttag(self, tag, attrs):
        attr = dict(attrs)
        if attr.get("id"):
            self.ids.add(attr["id"])
        if tag == "meta" and attr.get("http-equiv", "").lower() == "content-security-policy":
            self.csp = attr.get("content", "")
        if tag == "script" and attr.get("src"):
            self.scripts.append(attr["src"])
        if tag == "link" and attr.get("rel") == "stylesheet":
            self.styles.append(attr.get("href", ""))


def main():
    html, status = fetch("index.html")
    inspector = DocumentInspector()
    inspector.feed(html)
    expected = {
        "market-search", "market-grid", "market-city", "market-city-shortcuts",
        "rental-detail-dialog", "rental-detail-content",
        "renter-budget", "real-compare", "beta-feedback",
    }
    missing = expected - inspector.ids
    if missing:
        raise RuntimeError("Missing deployment UI IDs: " + ", ".join(sorted(missing)))
    for fragment in ("default-src 'none'", "script-src 'self'", "connect-src 'self'"):
        if fragment not in inspector.csp:
            raise RuntimeError("Missing deployed CSP fragment: " + fragment)
    for asset in ("./app.mjs", "./live.mjs", "./feedback.mjs"):
        if asset not in inspector.scripts:
            raise RuntimeError("Missing script reference: " + asset)
    for asset in (*inspector.scripts, *inspector.styles, "./live-utils.mjs",
                  "./listing-research.mjs"):
        body, code = fetch(asset)
        if code != 200 or not body.strip():
            raise RuntimeError("Missing deployed asset: " + asset)
    raw, code = fetch("./data/live-listings.json")
    payload = json.loads(raw)
    if code != 200 or payload.get("provider") != "RentCast":
        raise RuntimeError("Live snapshot missing or wrong provider")
    if not isinstance(payload.get("items"), list):
        raise RuntimeError("Live snapshot items malformed")
    count = len(payload["items"])
    cities = sorted({item.get("city", "") for item in payload["items"] if isinstance(item, dict)})
    print(f"PASS: deployed HTML, CSP, UI IDs, JS/CSS and provider snapshot reachable ({count} records)")
    print("Provider-record cities: " + (", ".join(cities) or "none"))
    print("NOTE: This is a deployment smoke test, not real-time availability, security certification or browser test.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, urllib.error.URLError, ValueError, KeyError, RuntimeError) as exc:
        print("FAIL: " + str(exc), file=sys.stderr)
        raise SystemExit(1)
