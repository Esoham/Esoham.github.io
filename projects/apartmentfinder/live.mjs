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

const SAVED_KEY="apartmentfinder-provider-saved-v1";
let savedIds=new Set();
try{
  const fromStorage=JSON.parse(localStorage.getItem(SAVED_KEY)||"[]");
  if(Array.isArray(fromStorage))savedIds=new Set(fromStorage.filter(id=>typeof id==="string").slice(0,300));
}catch{}
let visibleCount=12;
const savedOnlyEl=document.querySelector("#market-saved-only");
const sortEl=document.querySelector("#market-sort");
const moreEl=document.querySelector("#market-more");
const resetEl=document.querySelector("#market-reset");
function saveListing(id){
  if(savedIds.has(id))savedIds.delete(id);else savedIds.add(id);
  try{localStorage.setItem(SAVED_KEY,JSON.stringify([...savedIds]));}catch{}
  render();
}
function listingCard(item) {
  const card=dom("article","listing-card market-card");
  const art=dom("div","market-card-visual");
  const top=dom("div","market-card-top");
  top.append(dom("span","market-source","RentCast · reported rental"));
  const save=dom("button","market-save",savedIds.has(item.id)?"♥ Saved":"♡ Save");
  save.type="button";save.setAttribute("aria-pressed",String(savedIds.has(item.id)));
  save.setAttribute("aria-label",(savedIds.has(item.id)?"Remove saved rental: ":"Save rental: ")+item.address);
  save.addEventListener("click",()=>saveListing(item.id));
  top.append(save);art.append(top);
  const price=dom("div","market-hero-price",usd(item.rent));
  price.append(dom("span",""," / month listed"));
  art.append(price);
  art.append(dom("span","market-illustration-note","Property photo not supplied"));
  const body=dom("div","card-body market-card-body");
  body.append(dom("p","city",item.city+", GA "+(item.zip||"")));
  body.append(dom("h3","",item.address));
  const facts=dom("div","market-facts");
  const factValues=[
    item.beds===null?"Bedrooms unknown":item.beds===0?"Studio":item.beds+" bed",
    item.baths===null?"Bathrooms unknown":item.baths+" bath",
    item.sqft?" "+Number(item.sqft).toLocaleString("en-US")+" sq ft":null,
    item.propertyType||null
  ];
  for(const value of factValues.filter(Boolean))facts.append(dom("span","market-fact",value));
  body.append(facts);
  if(hasAmbiguousRentalScope(item))
    body.append(dom("p","market-warning","⚠ Rental scope needs checking: one-bedroom single-family record could refer to a room, not the whole home."));
  const last=new Date(item.lastSeenDate).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric",timeZone:"UTC"});
  const trust=dom("p","market-disclosure","Provider last saw this listing active: "+last+". Current availability and all fees are unverified.");
  body.append(trust);
  const actions=dom("div","market-card-actions");
  const plan=dom("button","market-primary-action","Calculate move-in cost");
  plan.type="button";
  plan.addEventListener("click",()=>{
    costInput("rent").value=item.rent;
    document.querySelector("#budget-selected").textContent="Planning for "+item.address+". Confirm all other fees directly with the leasing office.";
    updateCostPlanner();
    document.querySelector("#renter-budget").scrollIntoView({behavior:"smooth",block:"start"});
  });
  actions.append(plan);
  const map=document.createElement("a");
  map.className="market-secondary-action";map.textContent="View neighborhood ↗";
  map.href="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(item.address);
  map.rel="noopener noreferrer";map.target="_blank";
  actions.append(map);
  body.append(actions);
  const details=document.createElement("details");
  details.className="market-details";
  const summary=document.createElement("summary");
  summary.textContent="Details & how to verify";details.append(summary);
  details.append(dom("p","small","Ask the leasing contact: Is this the entire unit? Is it available? What is the total rent, deposit, application fee, monthly fees and lease term?"));
  if(item.officeName)details.append(dom("p","small","Provider-listed office: "+item.officeName));
  const website=trustedOfficeUrl(item.officeWebsite);
  if(website){
    const link=document.createElement("a");
    link.className="office-link";link.href=website;link.rel="noopener noreferrer";link.target="_blank";
    link.textContent="Visit office website ↗ (not necessarily this property's listing)";
    details.append(link);
  }else details.append(dom("p","small","No direct listing-office website was supplied. Use the neighborhood link to research the address independently."));
  body.append(details);
  card.append(art,body);
  return card;
}

function render() {
  grid.replaceChildren();
  if(!providerReady){countEl.textContent="";return;}
  let filtered=filterProviderListings(providerItems,{
    city:cityEl.value,zip:zipEl.value,propertyType:typeEl.value,
    maxRent:maxRentEl.value,minBeds:bedroomsEl.value
  });
  if(savedOnlyEl.checked)filtered=filtered.filter(item=>savedIds.has(item.id));
  if(sortEl.value==="newest")filtered.sort((a,b)=>Date.parse(b.lastSeenDate)-Date.parse(a.lastSeenDate)||a.rent-b.rent);
  else if(sortEl.value==="highest")filtered.sort((a,b)=>b.rent-a.rent);
  const shown=filtered.slice(0,visibleCount);
  countEl.textContent=filtered.length+" rental records match · Showing "+shown.length+". "+savedIds.size+" saved on this device.";
  grid.replaceChildren(...shown.map(listingCard));
  moreEl.hidden=shown.length>=filtered.length;
  if(!filtered.length)grid.append(dom("p","empty-state",savedOnlyEl.checked?
    "No saved rentals match these filters. Try turning off Saved only.":"No provider listings match these filters. Try a different city or price range."));
}

for (const select of [cityEl,bedroomsEl,typeEl]) select.addEventListener("change", render);
maxRentEl.addEventListener("input",render);
zipEl.addEventListener("input",render);
form.addEventListener("submit", event=>event.preventDefault());
savedOnlyEl.addEventListener("change",()=>{visibleCount=12;render();});
sortEl.addEventListener("change",render);
moreEl.addEventListener("click",()=>{visibleCount+=12;render();});
resetEl.addEventListener("click",()=>{
  form.reset();zipEl.value="";savedOnlyEl.checked=false;sortEl.value="lowest";visibleCount=12;render();
});

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
