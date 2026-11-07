import { validateSnapshot, filterProviderListings, trustedOfficeUrl, hasAmbiguousRentalScope, estimateRenterCosts, toggleRentalComparison, compareRentalFacts, rentalReviewFlags } from "./live-utils.mjs";

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


const costFields=["rent","income","utilities","otherMonthly","transportation","groceries","debtPayments","otherEssentials","deposit","applicationFee","adminFee","otherUpfront"];
const costInput=name=>document.querySelector("#budget-"+name);
const costResult=document.querySelector("#budget-results");
function updateCostPlanner(){
  const vals=Object.fromEntries(costFields.map(key=>[key,costInput(key).value]));
  const result=estimateRenterCosts(vals);
  if(!result.valid){costResult.textContent=result.error;return;}
  const rows=[
    ["Monthly housing estimate",usd(result.monthly)],
    ["Other essential expenses",usd(result.essentials)],
    ["Total entered monthly living costs",usd(result.livingTotal)],
    ["Left after entered living costs",result.livingRemaining===null?"Enter income":usd(result.livingRemaining)],
    ["Entered move-in total",usd(result.upfront)],
    ["Rent / take-home income",result.rentPercent===null?"Enter income":result.rentPercent.toFixed(1)+"%"]
  ];
  costResult.replaceChildren(...rows.map(([label,value])=>{
    const cell=dom("div","budget-result");
    cell.append(dom("span","",label),dom("strong","",value));
    return cell;
  }));
  const guidance=dom("p","budget-guidance",result.livingRemaining===null?
    "Enter take-home income to see what remains after entered expenses.":
    result.livingRemaining<0?
      "Entered living costs exceed take-home income. Review expenses or consider lower-cost housing.":
      "This is a cash-flow estimate, not approval for a rental. Consider savings, healthcare and unexpected expenses.");
  costResult.append(guidance);
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
let realComparison=[];
const realCompareStatus=document.querySelector("#real-compare-status");
const realCompareWrap=document.querySelector("#real-compare-wrap");
const realCompareHead=document.querySelector("#real-compare-head");
const realCompareBody=document.querySelector("#real-compare-body");
const realCompareClear=document.querySelector("#real-compare-clear");
function renderRealComparison(notice=""){
 const selected=compareRentalFacts(providerItems,realComparison);
 realCompareHead.replaceChildren();realCompareBody.replaceChildren();
 realCompareWrap.hidden=selected.length===0;
 realCompareClear.hidden=selected.length===0;
 realCompareStatus.textContent=notice||(selected.length===0?
  "Choose “Compare” on any real rental card above to start comparing.":
  selected.length+" of 3 real rentals selected. Prices are provider-reported; availability and fees are not verified.");
 if(!selected.length)return;
 const head=dom("tr");
 const title=dom("th","","Compare");title.scope="col";head.append(title);
 for(const item of selected){const th=dom("th","",item.address);th.scope="col";head.append(th);}
 realCompareHead.append(head);
 const lines=[
  ["Listed rent",item=>usd(item.rent)+" / month"],
  ["City",item=>item.city+", GA"],
  ["ZIP code",item=>item.zip||"Not provided"],
  ["Bedrooms",item=>item.beds===null?"Not provided":String(item.beds)],
  ["Bathrooms",item=>item.baths===null?"Not provided":String(item.baths)],
  ["Area",item=>item.sqft?Number(item.sqft).toLocaleString("en-US")+" sq ft":"Not provided"],
  ["Property type",item=>item.propertyType||"Not provided"],
  ["Last reported active",item=>new Date(item.lastSeenDate).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"})],
  ["Deposit / extra fees",()=> "Not provided — ask leasing office"],
  ["Entire-unit status",item=>hasAmbiguousRentalScope(item)?"Check: possible room rental":"Not independently verified"]
 ];
 for(const [label,value] of lines){
  const tr=dom("tr");const th=dom("th","",label);th.scope="row";tr.append(th);
  for(const item of selected)tr.append(dom("td","",value(item)));
  realCompareBody.append(tr);
 }
 const actionRow=dom("tr");const actionHeading=dom("th","","Next step");actionHeading.scope="row";actionRow.append(actionHeading);
 for(const item of selected){
  const td=dom("td");const btn=dom("button","compare-button","View details");
  btn.type="button";btn.addEventListener("click",()=>openRentalDetails(item));
  td.append(btn);actionRow.append(td);
 }
 realCompareBody.append(actionRow);
}
realCompareClear.addEventListener("click",()=>{realComparison=[];render();});
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

const detailDialog=document.querySelector("#rental-detail-dialog");
const detailContent=document.querySelector("#rental-detail-content");
document.querySelector("#rental-detail-close").addEventListener("click",()=>detailDialog.close());
detailDialog.addEventListener("click",event=>{if(event.target===detailDialog)detailDialog.close();});
function issueReportUrl(item){
 const title="Rental data concern: "+item.address.slice(0,110);
 const body=[
  "Provider-reported rental data concern",
  "",
  "Property address: "+item.address,
  "Provider record ID: "+item.id,
  "Reported listed rent: "+usd(item.rent),
  "",
  "What looks incorrect? (Please describe the issue without including your phone number, income, or other personal information.)",
  "",
  "Reminder: This is a public GitHub issue. An account is required to submit it."
 ].join("\n");
 return "https://github.com/Esoham/ApartmentFinder/issues/new?title="+encodeURIComponent(title)+"&body="+encodeURIComponent(body);
}
function reportLink(item){
 const a=dom("a","market-report-link","Flag a listing concern ↗");
 a.href=issueReportUrl(item);a.target="_blank";a.rel="noopener noreferrer";
 a.title="Opens a pre-filled public GitHub issue; a GitHub account is required";
 return a;
}
function makeFact(label,value){
 const wrapper=dom("div","detail-fact");
 wrapper.append(dom("span","",label),dom("strong","",value));
 return wrapper;
}
function openRentalDetails(item){
 detailContent.replaceChildren();
 const title=dom("h2","",item.address);
 title.id="rental-detail-title";
 detailContent.append(dom("p","eyebrow","ApartmentFinder · Provider-reported listing"),title);
 detailContent.append(dom("p","detail-price",usd(item.rent)+" per month · advertised rent only"));
 detailContent.append(dom("p","market-disclosure",
   "Reported active by RentCast. This is not a verified offer, application or lease. Confirm details directly with a property representative."));
 const facts=dom("div","detail-facts");
 const listingFacts=[
  ["City",item.city+", GA "+(item.zip||"")],
  ["Bedrooms",item.beds===null?"Not provided":item.beds===0?"Studio":String(item.beds)],
  ["Bathrooms",item.baths===null?"Not provided":String(item.baths)],
  ["Size",item.sqft?Number(item.sqft).toLocaleString("en-US")+" sq ft":"Not provided"],
  ["Property type",item.propertyType||"Not provided"],
  ["Last reported active",new Date(item.lastSeenDate).toLocaleDateString("en-US",{dateStyle:"medium",timeZone:"UTC"})],
  ["Listing office",item.officeName||"Not supplied"]
 ];
 listingFacts.forEach(([k,v])=>facts.append(makeFact(k,v)));
 detailContent.append(facts);
 if(hasAmbiguousRentalScope(item))
   detailContent.append(dom("p","market-warning","This one-bedroom single-family record may refer to a room or partial property. Confirm what the listed rent covers."));
 const info=dom("section","detail-checklist");
 info.append(dom("h3","","Questions to ask before applying"));
 const check=document.createElement("ul");
 ["Is the entire home or only a room included?","Is this specific unit currently available, and at what rent?",
  "What are the deposit, utilities, required fees and total monthly cost?",
  "What are the lease length, income criteria, pet rules and refund policy?"].forEach(q=>{
   const li=dom("li","",q);check.append(li);
  });
 info.append(check);detailContent.append(info);
 const actions=dom("div","detail-actions");
 const plan=dom("button","market-primary-action","Calculate my total cost");
 plan.type="button";plan.addEventListener("click",()=>{
  costInput("rent").value=item.rent;
  document.querySelector("#budget-selected").textContent="Planning for "+item.address+". Other charges must be confirmed with the property.";
  updateCostPlanner();detailDialog.close();
  document.querySelector("#renter-budget").scrollIntoView({behavior:"smooth",block:"start"});
 });
 actions.append(plan);
 const office=trustedOfficeUrl(item.officeWebsite);
 if(office){
  const a=dom("a","market-secondary-action","Contact listing office website ↗");
  a.href=office;a.target="_blank";a.rel="noopener noreferrer";
  actions.append(a);
 }else{
  actions.append(dom("p","small","Direct application/contact information is not supplied for this record. ApartmentFinder does not collect applications or payments."));
 }
 detailContent.append(actions);
 detailContent.append(dom("p","small","See something inaccurate? Reporting opens a public GitHub form in a new tab. An account is required; do not include private financial or contact information."));
 detailContent.append(reportLink(item));
 detailDialog.showModal();
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
  const flags=rentalReviewFlags(item);
  if(flags.includes("scope-unverified"))
    body.append(dom("p","market-warning","Rental scope unverified: this may be a room or shared accommodation, not an entire home."));
  if(flags.includes("contact-not-provided"))
    body.append(dom("p","market-review-note","Direct listing contact not provided. Research the property independently before paying any fees."));
  if(flags.includes("long-running-advertisement"))
    body.append(dom("p","market-review-note","Long-running advertisement: confirm current pricing and availability directly."));
  const last=new Date(item.lastSeenDate).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric",timeZone:"UTC"});
  const daysOld=Math.max(0,Math.floor((Date.now()-Date.parse(item.lastSeenDate))/86400000));
  const freshness=daysOld===0?"Seen by provider today":daysOld===1?"Seen by provider 1 day ago":"Seen by provider "+daysOld+" days ago";
  body.append(dom("p","market-freshness",freshness));
  const trust=dom("p","market-disclosure","Provider last saw this listing active: "+last+". Current availability and all fees are unverified.");
  body.append(trust);
  const actions=dom("div","market-card-actions");
  const detailsButton=dom("button","market-primary-action","View full details");
  detailsButton.type="button";detailsButton.addEventListener("click",()=>openRentalDetails(item));
  actions.append(detailsButton);
  const compare=dom("button","market-secondary-button",realComparison.includes(item.id)?"✓ Added to compare":"+ Compare");
  compare.type="button";compare.setAttribute("aria-pressed",String(realComparison.includes(item.id)));
  compare.setAttribute("aria-label",(realComparison.includes(item.id)?"Remove from comparison: ":"Add to comparison: ")+item.address);
  compare.addEventListener("click",()=>{
    const result=toggleRentalComparison(realComparison,item.id);
    realComparison=result.ids;
    render(result.limited?"You can compare up to three rentals. Remove one before adding another.":"");
    document.querySelector("#real-compare").scrollIntoView({behavior:"smooth",block:"start"});
  });
  actions.append(compare);
  const plan=dom("button","market-secondary-button","Calculate my costs");
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
  body.append(reportLink(item));
  card.append(art,body);
  return card;
}

function render(notice="") {
  grid.replaceChildren();
  renderRealComparison(typeof notice==="string"?notice:"");
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
