import { validateSnapshot, filterProviderListings, trustedOfficeUrl, hasAmbiguousRentalScope, estimateRenterCosts, toggleRentalComparison, compareRentalFacts, rentalReviewFlags } from "./live-utils.mjs";
import { LISTING_RESEARCH } from "./listing-research.mjs";

const statusEl = document.querySelector("#market-status");
const grid = document.querySelector("#market-grid");
const countEl = document.querySelector("#market-results");
const cityEl = document.querySelector("#market-city");
const shortcutWrap = document.querySelector("#market-city-shortcuts");
const coverageNote = document.querySelector("#market-coverage-note");
function setCity(value) {
  cityEl.value=value;
  visibleCount=12;
  render();
  document.querySelector("#market-grid").scrollIntoView({behavior:"smooth",block:"start"});
}
const PLANNED_CITIES=["Atlanta","College Park","Decatur","East Point","Forest Park","Hapeville","Marietta","Sandy Springs","Smyrna","Union City"];
function refreshCityShortcuts() {
  const available=new Set(providerItems.map(item=>item.city));
  shortcutWrap.replaceChildren();
  cityEl.replaceChildren();
  for (const name of ["",...PLANNED_CITIES]) {
    const count=name?providerItems.filter(item=>item.city===name).length:providerItems.length;
    const label=name||"All areas";
    const option=dom("option","",name?name+(count?"":" — awaiting listings"):"All areas");
    option.value=name;cityEl.append(option);
    const button=dom("button","city-shortcut",label);
    button.type="button";button.dataset.city=name;
    button.setAttribute("aria-pressed",String(cityEl.value===name));
    button.setAttribute("aria-label",name?(name+(count?" — provider records available":" — awaiting rental records")):"All areas");
    if(name&&!available.has(name))button.classList.add("city-awaiting");
    button.addEventListener("click",()=>setCity(name));
    shortcutWrap.append(button);
  }
  const count=[...available].filter(name=>PLANNED_CITIES.includes(name)).length;
  coverageNote.textContent="Search all 10 planned metro Atlanta areas. "+count+" currently have provider records; cities marked “awaiting listings” will show results after their next successful data refresh.";
}

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
const ambiguousEl=document.querySelector("#market-exclude-ambiguous");
const ambiguityNote=document.querySelector("#market-ambiguity-note");
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
function researchedScope(item){
 return Object.hasOwn(LISTING_RESEARCH,item.id)?LISTING_RESEARCH[item.id]:null;
}
function researchEvidence(item){
 const info=researchedScope(item);
 if(!info || info.scope!=="room-advertised")return null;
 const wrap=dom("div","market-evidence");
 wrap.append(dom("strong","","External listing identifies room rental"));
 wrap.append(dom("p","",info.note+" Renter research checked "+info.checkedOn+"; current price and availability remain unverified."));
 const link=dom("a","market-evidence-link","Read source: "+info.sourceName+" ↗");
 link.href=info.sourceUrl;link.target="_blank";link.rel="noopener noreferrer";
 wrap.append(link);
 return wrap;
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
 const hero=dom("div","detail-hero");
 const mainPrice=dom("div","detail-hero-rent");
 mainPrice.append(dom("span","","Advertised monthly rent"),dom("strong","",usd(item.rent)),dom("small","","RentCast-reported; fees unknown"));
 const heroStatus=dom("div","detail-hero-status");
 heroStatus.append(dom("span","detail-status-pill","Not independently verified"));
 heroStatus.append(dom("p","","Provider last reported active: "+new Date(item.lastSeenDate).toLocaleDateString("en-US",{dateStyle:"medium",timeZone:"UTC"})));
 hero.append(mainPrice,heroStatus);detailContent.append(hero);
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
 const expenseSection=dom("section","detail-cost-snapshot");
 expenseSection.append(dom("h3","","What would this rental actually cost?"));
 expenseSection.append(dom("p","","Known advertised rent: "+usd(item.rent)+"/month. Deposit, required fees, utilities, parking, and lease terms are not supplied or independently verified for this record."));
 const costHint=dom("p","small","Use the budget planner to add your own estimates before contacting a property representative.");
 expenseSection.append(costHint);detailContent.append(expenseSection);
 const detailEvidence=researchEvidence(item);
 if(detailEvidence)detailContent.append(detailEvidence);
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
 const save=dom("button","market-secondary-button",savedIds.has(item.id)?"♥ Saved — remove":"♡ Save rental");
 save.type="button";
 save.setAttribute("aria-pressed",String(savedIds.has(item.id)));
 save.addEventListener("click",()=>{
   saveListing(item.id);
   save.textContent=savedIds.has(item.id)?"♥ Saved — remove":"♡ Save rental";
   save.setAttribute("aria-pressed",String(savedIds.has(item.id)));
 });
 actions.append(save);
 const compare=dom("button","market-secondary-button",realComparison.includes(item.id)?"✓ Remove comparison":"+ Compare rental");
 compare.type="button";
 compare.setAttribute("aria-pressed",String(realComparison.includes(item.id)));
 compare.addEventListener("click",()=>{
   const result=toggleRentalComparison(realComparison,item.id);
   realComparison=result.ids;
   render(result.limited?"You can compare up to three rentals. Remove one before adding another.":"");
   compare.textContent=realComparison.includes(item.id)?"✓ Remove comparison":"+ Compare rental";
   compare.setAttribute("aria-pressed",String(realComparison.includes(item.id)));
   if(!result.limited){detailDialog.close();document.querySelector("#real-compare").scrollIntoView({behavior:"smooth",block:"start"});}
 });
 actions.append(compare);
 const neighborhood=dom("a","market-secondary-action","Explore neighborhood map ↗");
 neighborhood.href="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(item.address);
 neighborhood.target="_blank";neighborhood.rel="noopener noreferrer";
 actions.append(neighborhood);
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
  const price=dom("button","market-hero-price market-open-price",usd(item.rent));
  price.type="button";
  price.setAttribute("aria-label","View rental details for "+item.address+", listed at "+usd(item.rent)+" per month");
  price.append(dom("span",""," / month listed"));
  price.addEventListener("click",()=>openRentalDetails(item));
  art.append(price);
  art.append(dom("span","market-illustration-note","Property photo not supplied"));
  const body=dom("div","card-body market-card-body");
  body.append(dom("p","city",item.city+", GA "+(item.zip||"")));
  const heading=dom("h3","");
  const addressButton=dom("button","market-address-button",item.address);
  addressButton.type="button";
  addressButton.setAttribute("aria-label","View details: "+item.address);
  addressButton.addEventListener("click",()=>openRentalDetails(item));
  heading.append(addressButton);body.append(heading);
  const facts=dom("div","market-facts");
  const factValues=[
    item.beds===null?"Bedrooms unknown":item.beds===0?"Studio":item.beds+" bed",
    item.baths===null?"Bathrooms unknown":item.baths+" bath",
    item.sqft?" "+Number(item.sqft).toLocaleString("en-US")+" sq ft":null,
    item.propertyType||null
  ];
  for(const value of factValues.filter(Boolean))facts.append(dom("span","market-fact",value));
  body.append(facts);
  const publicEvidence=researchEvidence(item);
  if(publicEvidence)body.append(publicEvidence);
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
  for(const button of shortcutWrap.querySelectorAll(".city-shortcut"))
    button.setAttribute("aria-pressed",String(button.dataset.city===cityEl.value));
  grid.replaceChildren();
  renderRealComparison(typeof notice==="string"?notice:"");
  if(!providerReady){countEl.textContent="";return;}
  let filtered=filterProviderListings(providerItems,{
    city:cityEl.value,zip:zipEl.value,propertyType:typeEl.value,
    maxRent:maxRentEl.value,minBeds:bedroomsEl.value
  });
  const ambiguousCount=filtered.filter(hasAmbiguousRentalScope).length;
  if(ambiguousEl.checked)filtered=filtered.filter(item=>!hasAmbiguousRentalScope(item));
  ambiguityNote.textContent=ambiguousCount
    ? (ambiguousEl.checked?ambiguousCount+" potentially shared/room rental records hidden. Uncheck the filter to review them.":ambiguousCount+" potentially shared/room rental records included and flagged. Confirm rental scope independently.")
    : "All listings still require independent availability and price verification.";
  if(savedOnlyEl.checked)filtered=filtered.filter(item=>savedIds.has(item.id));
  if(sortEl.value==="newest")filtered.sort((a,b)=>Date.parse(b.lastSeenDate)-Date.parse(a.lastSeenDate)||a.rent-b.rent);
  else if(sortEl.value==="highest")filtered.sort((a,b)=>b.rent-a.rent);
  const shown=filtered.slice(0,visibleCount);
  countEl.textContent=filtered.length+" rental records match · Showing "+shown.length+". "+savedIds.size+" saved on this device.";
  grid.replaceChildren(...shown.map(listingCard));
  moreEl.hidden=shown.length>=filtered.length;
  if(!filtered.length){
    const none=dom("div","empty-state market-empty");
    const hasCity=cityEl.value;
    const recordsForCity=providerItems.some(item=>item.city===hasCity);
    none.append(dom("h3","",hasCity&&!recordsForCity?"We're expanding into "+hasCity:"No matching rentals right now"));
    none.append(dom("p","",hasCity&&!recordsForCity?
      "This city is on our coverage list, but we don't yet have a sufficiently recent licensed listing for it. We won't substitute invented rentals.":
      "Try increasing the rent limit, changing filters, or choosing another city."));
    const clear=dom("button","market-secondary-button","Explore all areas");
    clear.type="button";clear.addEventListener("click",()=>{cityEl.value="";maxRentEl.value="";savedOnlyEl.checked=false;render();});
    none.append(clear);
    grid.append(none);
  }
}

for (const select of [cityEl,bedroomsEl,typeEl]) select.addEventListener("change", render);
maxRentEl.addEventListener("input",render);
zipEl.addEventListener("input",render);
form.addEventListener("submit", event=>event.preventDefault());
ambiguousEl.addEventListener("change",()=>{visibleCount=12;render();});
savedOnlyEl.addEventListener("change",()=>{visibleCount=12;render();});
sortEl.addEventListener("change",render);
moreEl.addEventListener("click",()=>{visibleCount+=12;render();});
resetEl.addEventListener("click",()=>{
  form.reset();zipEl.value="";ambiguousEl.checked=true;savedOnlyEl.checked=false;sortEl.value="lowest";visibleCount=12;render();
});

function markFeedUnavailable(message){
  refreshCityShortcuts();
  coverageNote.textContent=message+" All 10 planned cities remain selectable; listings will appear after a successful provider refresh.";
  countEl.textContent="No current rental records to show.";
  ambiguityNote.textContent="Try the budget planner or the external marketplace alternatives below.";
  moreEl.hidden=true;
}
async function load() {
  try {
    const response = await fetch("./data/live-listings.json", {cache:"no-store"});
    if (!response.ok) throw new Error("snapshot missing");
    const payload = await response.json();
    const result = validateSnapshot(payload);
    if (result.state === "not_configured") {
      statusEl.textContent = "Rental feed is not connected yet. See the independent marketplace options below.";
      markFeedUnavailable("City coverage is temporarily unavailable because the provider feed is not connected.");
      return;
    }
    if (result.state === "stale") {
      statusEl.textContent = "The authorized rental snapshot has expired. No stale rentals are displayed. See the other marketplace options below while the feed refreshes.";
      markFeedUnavailable("City coverage is temporarily unavailable while the listing snapshot refreshes.");
      return;
    }
    if (result.state === "empty") {
      statusEl.textContent = "The authorized feed returned no sufficiently recent active records in the configured cities. Check original listing sites directly.";
      markFeedUnavailable("No current provider records are available for the configured areas.");
      return;
    }
    if (result.state !== "ready") throw new Error("unrecognized snapshot");
    providerItems = result.items;
    providerReady = true;
    const last = new Date(result.retrievedAt);
    statusEl.textContent = "Provider-reported active listings, last refreshed " +
      last.toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric",timeZone:"UTC"}) +
      ". Contact the listing office to confirm rent, fees and actual unit availability.";
    refreshCityShortcuts();
    for (const type of [...new Set(providerItems.map(x=>x.propertyType).filter(Boolean))].sort()) {
      const option = dom("option","",type);
      option.value = type;
      typeEl.append(option);
    }
    render();
  } catch {
    statusEl.textContent = "Rental feed unavailable. You can still use the budget planner or browse external marketplaces in the fallback section.";
    markFeedUnavailable("City coverage could not be loaded. Please try again later.");
  }
}
load();
