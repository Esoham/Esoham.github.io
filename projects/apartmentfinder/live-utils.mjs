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

/** Automated review flags are warnings, not independent verification. */
export function rentalReviewFlags(item) {
  const flags=[];
  if (hasAmbiguousRentalScope(item)) flags.push("scope-unverified");
  if (!item.officeName && !trustedOfficeUrl(item.officeWebsite)) flags.push("contact-not-provided");
  const listed=Date.parse(item.listedDate ?? "");
  const lastSeen=Date.parse(item.lastSeenDate ?? "");
  if (Number.isFinite(listed) && Number.isFinite(lastSeen) &&
      lastSeen-listed>180*86400000) flags.push("long-running-advertisement");
  return flags;
}

export function auditRentalSnapshot(payload, now=new Date()) {
  const result=validateSnapshot(payload,now);
  if(result.state!=="ready")return {state:result.state,total:0,review:[],counts:{}};
  const counts={"scope-unverified":0,"contact-not-provided":0,"long-running-advertisement":0};
  const review=result.items.map(item=>({
    id:item.id,address:item.address,city:item.city,rent:item.rent,
    flags:rentalReviewFlags(item)
  })).filter(item=>item.flags.length);
  for(const item of review)for(const flag of item.flags)counts[flag]++;
  return {state:result.state,total:result.items.length,review,counts};
}

/** Calculator for user-entered costs; missing provider fees are never inferred. */
export function estimateRenterCosts(values) {
  const names=["rent","income","utilities","otherMonthly","deposit","applicationFee","adminFee","otherUpfront",
    "transportation","groceries","debtPayments","otherEssentials"];
  const v={};
  for(const name of names){
    const raw=values[name] ?? 0;
    if(raw === "" || !Number.isFinite(Number(raw)) || Number(raw)<0)
      return {valid:false,error:"Enter a valid non-negative amount for "+name+"."};
    v[name]=Number(raw);
  }
  if(v.rent===0) return {valid:false,error:"Enter a listed monthly rent."};
  const monthly=v.rent+v.utilities+v.otherMonthly;
  const essentials=v.transportation+v.groceries+v.debtPayments+v.otherEssentials;
  const livingTotal=monthly+essentials;
  const upfront=v.rent+v.deposit+v.applicationFee+v.adminFee+v.otherUpfront;
  return {valid:true,monthly,upfront,essentials,livingTotal,
    remaining:v.income>0?v.income-monthly:null,
    livingRemaining:v.income>0?v.income-livingTotal:null,
    rentPercent:v.income>0?100*v.rent/v.income:null,
    livingPercent:v.income>0?100*livingTotal/v.income:null};
}

/** Pure shortlist toggle. A real-rental comparison is limited to three records. */
export function toggleRentalComparison(ids, id, limit = 3) {
  const current = Array.isArray(ids) ? [...new Set(ids.filter(x => typeof x === "string"))] : [];
  if (current.includes(id)) return { ids: current.filter(x => x !== id), limited: false };
  if (current.length >= limit) return { ids: current, limited: true };
  return { ids: [...current, id], limited: false };
}

/** Only compare known provider fields; unknown charges are never treated as zero. */
export function compareRentalFacts(items, ids) {
  const byId = new Map(items.map(item => [item.id, item]));
  return ids.map(id => byId.get(id)).filter(Boolean);
}
