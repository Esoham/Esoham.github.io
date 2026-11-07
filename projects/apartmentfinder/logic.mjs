/**
 * Pure, dependency-free search and cost logic; useful for isolated unit tests.
 * All money values use whole USD in synthetic data, not production pricing.
 */
export function moveInCost(home) {
  return home.rent + home.deposit + home.applicationFee + home.adminFee;
}

export function monthlyEstimate(home, includePetRent = false) {
  return home.rent + home.estimatedUtilities + home.parkingFee + (includePetRent ? home.petRent : 0);
}

export function filterHomes(homes, filters = {}) {
  const city = (filters.city ?? "").toString().trim().toLocaleLowerCase("en-US");
  const zip = (filters.zip ?? "").toString().trim();
  const maxRent = normalizeBound(filters.maxRent);
  const maxMoveIn = normalizeBound(filters.maxMoveIn);
  const minBeds = Number(filters.minBeds ?? 0);
  const saved = filters.savedIds instanceof Set ? filters.savedIds : new Set();
  return homes.filter(home =>
    (!city || home.city.toLocaleLowerCase("en-US") === city) &&
    (!zip || home.zip.startsWith(zip)) &&
    (maxRent === null || home.rent <= maxRent) &&
    (maxMoveIn === null || moveInCost(home) <= maxMoveIn) &&
    home.beds >= (Number.isFinite(minBeds) && minBeds >= 0 ? minBeds : 0) &&
    (!filters.petFriendly || home.petFriendly) &&
    (!filters.savedOnly || saved.has(home.id))
  );
}

/** Empty input => no maximum; 0 remains a real boundary, not "unlimited". */
export function normalizeBound(value) {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function sortHomes(homes, by = "rent", includePetRent = false) {
  const metrics = {
    rent: home => home.rent,
    moveIn: moveInCost,
    monthly: home => monthlyEstimate(home, includePetRent)
  };
  const metric = metrics[by] ?? metrics.rent;
  return [...homes].sort((a, b) => metric(a) - metric(b) || a.id.localeCompare(b.id));
}

export function money(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

export function selectCompare(ids, id, limit = 3) {
  const result = new Set(ids);
  if (result.has(id)) { result.delete(id); return { ids: result, limited: false }; }
  if (result.size >= limit) return { ids: result, limited: true };
  result.add(id);
  return { ids: result, limited: false };
}
