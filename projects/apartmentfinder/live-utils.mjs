/** Pure helpers for provider-sourced rentals; never merge with fictional demo data. */
export const MAX_SNAPSHOT_DAYS = 14;

export function validateSnapshot(payload, now = new Date()) {
  if (!payload || payload.provider !== "RentCast" || !Array.isArray(payload.items)) {
    return { state: "invalid", items: [] };
  }
  if (payload.status === "not_configured") {
    return { state: "not_configured", items: [] };
  }
  if (payload.status !== "ready") {
    return { state: "invalid", items: [] };
  }
  const timestamp = new Date(payload.retrievedAt);
  const age = now.getTime() - timestamp.getTime();
  if (!Number.isFinite(age) || age < -3600000 || age > MAX_SNAPSHOT_DAYS * 86400000) {
    return { state: "stale", items: [] };
  }
  const items = payload.items.filter(item =>
    item && typeof item.id === "string" && typeof item.address === "string" &&
    typeof item.city === "string" && item.state === "GA" &&
    Number.isFinite(item.rent) && item.rent >= 100 &&
    item.status === "Active" &&
    typeof item.lastSeenDate === "string" &&
    Number.isFinite(Date.parse(item.lastSeenDate)) &&
    now.getTime() - Date.parse(item.lastSeenDate) >= -3600000 &&
    now.getTime() - Date.parse(item.lastSeenDate) <= MAX_SNAPSHOT_DAYS * 86400000
  );
  return { state: items.length ? "ready" : "empty", items, retrievedAt: payload.retrievedAt };
}

export function filterProviderListings(items, filters = {}) {
  const city = String(filters.city ?? "").trim().toLocaleLowerCase("en-US");
  const rentInput = String(filters.maxRent ?? "").trim();
  const maxRent = rentInput && Number.isFinite(Number(rentInput)) && Number(rentInput) >= 0
    ? Number(rentInput) : null;
  const minBeds = Math.max(0, Number(filters.minBeds) || 0);
  const zip = String(filters.zip ?? "").trim();
  const propertyType = String(filters.propertyType ?? "").trim().toLocaleLowerCase("en-US");
  return items.filter(item =>
    (!city || item.city.toLocaleLowerCase("en-US") === city) &&
    (!zip || String(item.zip ?? "").trim() === zip) &&
    (!propertyType || String(item.propertyType ?? "").toLocaleLowerCase("en-US") === propertyType) &&
    (maxRent === null || item.rent <= maxRent) &&
    (minBeds === 0 || (Number.isFinite(item.beds) && item.beds >= minBeds))
  ).sort((a,b) => a.rent - b.rent || a.id.localeCompare(b.id));
}

export function trustedOfficeUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password ? parsed.href : null;
  } catch { return null; }
}

/** Flag listings that may represent a room or incomplete whole-home information. */
export function hasAmbiguousRentalScope(item) {
  const type = String(item?.propertyType ?? "").toLocaleLowerCase("en-US");
  return (type === "single family" || type === "single-family") && item?.beds === 1;
}
