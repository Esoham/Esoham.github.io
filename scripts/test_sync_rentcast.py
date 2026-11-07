"""Contract tests use mocked RentCast responses; no live API calls or API key needed."""
import datetime as dt
import json
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import sync_rentcast as r

NOW = dt.datetime(2026, 11, 7, 12, 0, tzinfo=dt.timezone.utc)

def example(**updates):
    data = {
        "id": "123 Demo Rd, Atlanta, GA",
        "formattedAddress": "123 Demo Rd, Atlanta, GA 30303",
        "city": "Atlanta",
        "state": "GA",
        "zipCode": "30303",
        "status": "Active",
        "price": 1135,
        "bedrooms": 1,
        "bathrooms": 1,
        "squareFootage": 675,
        "propertyType": "Apartment",
        "lastSeenDate": "2026-11-06T12:00:00Z",
        "listedDate": "2026-11-02T12:00:00Z",
        "listingOffice": {"name": "Sample Leasing Office", "website": "https://example.com"}
    }
    data.update(updates)
    return data

class RentCastIngestTests(unittest.TestCase):
    def test_accepts_fresh_active_georgia_rental(self):
        item = r.normalize_record(example(), NOW)
        self.assertEqual(item["rent"], 1135.0)
        self.assertEqual(item["status"], "Active")
        self.assertEqual(item["officeWebsite"], "https://example.com")

    def test_rejects_inactive_or_not_georgia(self):
        self.assertIsNone(r.normalize_record(example(status="Inactive"), NOW))
        self.assertIsNone(r.normalize_record(example(state="TX"), NOW))

    def test_rejects_missing_and_stale_last_seen_dates(self):
        self.assertIsNone(r.normalize_record(example(lastSeenDate=None), NOW))
        self.assertIsNone(r.normalize_record(example(lastSeenDate="2026-10-12T12:00:00Z"), NOW))
        self.assertIsNone(r.normalize_record(example(lastSeenDate="2026-11-10T12:00:00Z"), NOW))

    def test_rejects_missing_invalid_and_negative_rents(self):
        for rent in [None, "1200", True, -100, 1, 100000]:
            self.assertIsNone(r.normalize_record(example(price=rent), NOW))

    def test_sanitizes_non_https_website(self):
        item = r.normalize_record(example(listingOffice={"name": "Test", "website": "javascript:alert(1)"}), NOW)
        self.assertIsNone(item["officeWebsite"])

    def test_does_not_guess_optional_size_or_bedrooms(self):
        item = r.normalize_record(example(bedrooms=None, bathrooms=None, squareFootage=None), NOW)
        self.assertIsNone(item["beds"])
        self.assertIsNone(item["baths"])
        self.assertIsNone(item["sqft"])

    def test_dedupes_by_id_and_bounded_city_queries(self):
        calls = []
        def fetch(city, key):
            calls.append(city)
            return [example()]
        snapshot = r.build_snapshot("testing-key", now=NOW, fetch=fetch)
        self.assertEqual(calls, list(r.CITIES))
        self.assertEqual(len(snapshot["items"]), 1)
        self.assertEqual(snapshot["status"], "ready")

    def test_rejects_blank_key_before_requests(self):
        with self.assertRaises(ValueError):
            r.build_snapshot("", now=NOW, fetch=lambda c,k: self.fail("Should not fetch"))

    def test_provider_failure_does_not_create_partial_snapshot(self):
        calls = []
        def fetch(city, key):
            calls.append(city)
            if len(calls) == 3:
                raise RuntimeError("Simulated provider failure")
            return [example()]
        with self.assertRaises(RuntimeError):
            r.build_snapshot("testing-key", now=NOW, fetch=fetch)

    def test_snapshot_contains_only_safe_fields(self):
        raw = example(listingAgent={"email": "do-not-publish@example.org", "phone": "5551234"},
                      listingOffice={"email": "private@example.org", "website": "https://example.com"})
        snapshot = r.build_snapshot("test-key", now=NOW, fetch=lambda c,k:[raw])
        assert len(snapshot["items"]) == 1
        dumped = json.dumps(snapshot)
        self.assertNotIn("private@example.org", dumped)
        self.assertNotIn("do-not-publish@example.org", dumped)

if __name__ == "__main__":
    unittest.main()
