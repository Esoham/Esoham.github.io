import { validateSnapshot, filterProviderListings, trustedOfficeUrl, hasAmbiguousRentalScope, estimateRenterCosts } from "./live-utils.mjs";

const statusEl = document.querySelector("#market-status");
const grid = document.querySelector("#market-grid");
const countEl = document.querySelector("#market-results");
const cityEl = document.querySelector("#market-city");
const maxRentEl = document.querySelector("#market-max-rent");
const bedroomsEl = document.querySelector("#market-bedrooms");
const zipEl = document.querySelector("#market-zip");
const typeEl = document.querySelector("#market-property-type");
const form = document.querySelector("#market-filters");
let providerItems = [];
let providerReady = false;

function dom(tag, className, value) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (value !== undefined) el.textContent = String(value);
  return el;
}

function usd(value) {
  return new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", maximumFractionDigits:0 }).format(value);
}


const costFields=["rent","income","utilities","otherMonthly","deposit","applicationFee","adminFee","otherUpfront"];
const costInput=name=>document.querySelector("#budget-"+name);
const costResult=document.querySelector("#budget-results");
function updateCostPlanner(){
  const vals=Object.fromEntries(costFields.map(key=>[key,costInput(key).value]));
  const result=estimateRenterCosts(vals);
  if(!result.valid){costResult.textContent=result.error;return;}
  const rows=[
    ["Monthly housing estimate",usd(result.monthly)],
    ["Entered move-in total",usd(result.upfront)],
    ["Rent / take-home income",result.rentPercent===null?"Enter income":result.rentPercent.toFixed(1)+"%"],
    ["Remaining after housing",result.remaining===null?"Enter income":usd(result.remaining)]
  ];
  costResult.replaceChildren(...rows.map(([label,value])=>{
    const cell=dom("div","budget-result");
    cell.append(dom("span","",label),dom("strong","",value));
    return cell;
  }));
}
costFields.forEach(key=>costInput(key).addEventListener("input",updateCostPlanner));
document.querySelector("#budget-form").addEventListener("submit",event=>event.preventDefault());
updateCostPlanner();

function listingCard(item) {
  const card = dom("article","listing-card");
  const art = dom("div", "listing-art sage");
  art.append(dom("span", "sample-tag", "Provider-reported rental"));
  const body = dom("div", "card-body");
  body.append(dom("p","city",item.city + ", GA " + (item.zip || "")));
  body.append(dom("h3","",item.address));
  body.append(dom("p","facts", (item.beds === null ? "Bedrooms not provided" : item.beds === 0 ? "Studio" : item.beds + " beds") +
    " · " + (item.baths ?? "Bath count unavailable") + " baths" +
    (item.sqft ? " · " + item.sqft + " sq ft" : "")));
  const price = dom("p", "price-market", usd(item.rent) + " / month listed rent");
  body.append(price);
  if (hasAmbiguousRentalScope(item)) {
    body.append(dom("p", "small", "Check rental scope: this single-family record reports one bedroom. The price may be for a room or partial property; confirm what is included."));
  }
  if (item.propertyType) body.append(dom("p","small","Provider property type: " + item.propertyType));
  const lastSeenDate = new Date(item.lastSeenDate);
  body.append(dom("p", "small", "Provider last saw listing active: " + lastSeenDate.toLocaleDateString("en-US", {year:"numeric",month:"short",day:"numeric", timeZone:"UTC"})));
  body.append(dom("p", "small", "Deposits, application fees, utilities, pet restrictions and unit availability: not verified."));
  if (item.officeName) body.append(dom("p","small","Listing office: " + item.officeName));
  const website = trustedOfficeUrl(item.officeWebsite);
  if (website) {
    const link = dom("a","office-link","Visit listing office website ↗");
    link.href = website;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    body.append(link);
  }
  const plan=dom("button","compare-button","Plan costs for this rental");
  plan.type="button";
  plan.addEventListener("click",()=>{
    costInput("rent").value=item.rent;
    document.querySelector("#budget-selected").textContent="Planning for "+item.address+". Check all other fees with the leasing office.";
    updateCostPlanner();
    document.querySelector("#renter-budget").scrollIntoView({behavior:"smooth",block:"start"});
  });
  body.append(plan);
  card.append(art,body);
  return card;
}

function render() {
  grid.replaceChildren();
  if (!providerReady) { countEl.textContent = ""; return; }
  const filtered = filterProviderListings(providerItems,{
    city: cityEl.value,
    zip: zipEl.value,
    propertyType: typeEl.value,
    maxRent: maxRentEl.value,
    minBeds: bedroomsEl.value
  });
  countEl.textContent = filtered.length + " provider-reported rental" + (filtered.length === 1 ? "" : "s") + " match your filters. Showing up to 36.";
  grid.replaceChildren(...filtered.slice(0,36).map(listingCard));
  if (!filtered.length) grid.append(dom("p","empty-state","No provider listings match this budget. Try increasing the maximum rent or changing the city."));
}

for (const select of [cityEl,bedroomsEl,typeEl]) select.addEventListener("change", render);
maxRentEl.addEventListener("input",render);
zipEl.addEventListener("input",render);
form.addEventListener("submit", event=>event.preventDefault());

async function load() {
  try {
    const response = await fetch("./data/live-listings.json", {cache:"no-store"});
    if (!response.ok) throw new Error("snapshot missing");
    const payload = await response.json();
    const result = validateSnapshot(payload);
    if (result.state === "not_configured") {
      statusEl.textContent = "Live rental-data connection is not activated yet. Use the marketplace links above to browse current listings.";
      return;
    }
    if (result.state === "stale") {
      statusEl.textContent = "The last licensed listing snapshot is too old to display. Visit the rental marketplace links above for current availability.";
      return;
    }
    if (result.state === "empty") {
      statusEl.textContent = "The authorized feed returned no sufficiently recent active records in the configured cities. Check original listing sites directly.";
      return;
    }
    if (result.state !== "ready") throw new Error("unrecognized snapshot");
    providerItems = result.items;
    providerReady = true;
    const last = new Date(result.retrievedAt);
    statusEl.textContent = "Provider-reported active listings, last refreshed " +
      last.toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric",timeZone:"UTC"}) +
      ". Contact the listing office to confirm rent, fees and actual unit availability.";
    for (const city of [...new Set(providerItems.map(x=>x.city))].sort()) {
      const option = dom("option","",city);
      option.value = city;
      cityEl.append(option);
    }
    for (const type of [...new Set(providerItems.map(x=>x.propertyType).filter(Boolean))].sort()) {
      const option = dom("option","",type);
      option.value = type;
      typeEl.append(option);
    }
    render();
  } catch {
    statusEl.textContent = "Rental feed unavailable. You can still browse current rental marketplace listings using the external links above.";
  }
}
load();
