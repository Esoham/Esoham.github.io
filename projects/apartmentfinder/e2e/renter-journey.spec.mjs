import { test, expect } from "@playwright/test";

const fakeRecords = [
  {id:"home-a",address:"100 Sample Street, Atlanta, GA 30312",city:"Atlanta",state:"GA",zip:"30312",rent:900,beds:1,baths:1,sqft:700,propertyType:"Apartment",status:"Active"},
  {id:"home-b",address:"200 Sample Street, College Park, GA 30337",city:"College Park",state:"GA",zip:"30337",rent:1050,beds:2,baths:1,sqft:900,propertyType:"Apartment",status:"Active"},
  {id:"home-c",address:"300 Sample Street, Atlanta, GA 30312",city:"Atlanta",state:"GA",zip:"30312",rent:1150,beds:2,baths:2,sqft:950,propertyType:"Condo",status:"Active"},
  {id:"home-d",address:"400 Sample Street, Atlanta, GA 30312",city:"Atlanta",state:"GA",zip:"30312",rent:1200,beds:2,baths:2,sqft:1000,propertyType:"Apartment",status:"Active"}
];
test.beforeEach(async ({page}) => {
  const now = new Date().toISOString();
  await page.route("**/data/live-listings.json", route =>
    route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({
      provider:"RentCast",status:"ready",retrievedAt:now,
      items:fakeRecords.map(record=>({...record,lastSeenDate:now}))
    })}));
  await page.goto("/");
  await expect(page.locator("#market-grid .market-card")).toHaveCount(4);
});

test("filter by city and rent then reset", async ({page})=>{
  await page.locator("#market-city").selectOption("College Park");
  await expect(page.locator("#market-grid .market-card")).toHaveCount(1);
  await expect(page.locator("#market-grid")).toContainText("200 Sample Street");
  await page.locator("#market-max-rent").fill("950");
  await expect(page.locator("#market-grid .market-card")).toHaveCount(0);
  await page.getByRole("button",{name:"Clear filters"}).click();
  await expect(page.locator("#market-grid .market-card")).toHaveCount(4);
});

test("open property details and close without leaving site", async ({page})=>{
  await page.locator("#market-grid .market-card").first().getByRole("button",{name:"View full details"}).click();
  const dialog=page.getByRole("dialog",{name:"100 Sample Street, Atlanta, GA 30312"});
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Questions to ask before applying");
  await page.getByRole("button",{name:"Close property details"}).click();
  await expect(dialog).not.toBeVisible();
});

test("save rental, filter saved only, and restore", async ({page})=>{
  await page.locator("#market-grid .market-card").first().getByRole("button",{name:/Save rental/}).click();
  await page.locator("#market-saved-only").check();
  await expect(page.locator("#market-grid .market-card")).toHaveCount(1);
  await page.reload();
  await expect(page.locator("#market-grid .market-card")).toHaveCount(4);
  await page.locator("#market-saved-only").check();
  await expect(page.locator("#market-grid .market-card")).toHaveCount(1);
});

test("compare three real records and enforce selection limit", async ({page})=>{
  for (const address of ["100 Sample Street","200 Sample Street","300 Sample Street"]) {
    const card=page.locator("#market-grid .market-card").filter({hasText:address});
    await card.getByRole("button",{name:/Add to comparison/}).click();
  }
  await expect(page.locator("#real-compare-wrap")).toBeVisible();
  await expect(page.locator("#real-compare-head th")).toHaveCount(4);
  const fourth=page.locator("#market-grid .market-card").filter({hasText:"400 Sample Street"});
  await fourth.getByRole("button",{name:/Add to comparison/}).click();
  await expect(page.locator("#real-compare-status")).toContainText("up to three rentals");
  await expect(page.locator("#real-compare-head th")).toHaveCount(4);
  await page.getByRole("button",{name:"Clear real-rental comparison"}).click();
  await expect(page.locator("#real-compare-wrap")).toBeHidden();
});

test("calculate monthly housing and move-in cost for selected listing",async ({page})=>{
  await page.locator("#market-grid .market-card").first().getByRole("button",{name:"Calculate my costs"}).click();
  await expect(page.locator("#budget-rent")).toHaveValue("900");
  await page.locator("#budget-income").fill("2600");
  await page.locator("#budget-utilities").fill("150");
  await page.locator("#budget-deposit").fill("450");
  await page.locator("#budget-applicationFee").fill("50");
  await expect(page.locator("#budget-results")).toContainText("$1,050");
  await expect(page.locator("#budget-results")).toContainText("$1,400");
});

test("no horizontal document overflow on this viewport",async ({page})=>{
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
  expect(overflow).toBe(false);
});

test("listing concern link is visible and warns that reporting requires GitHub",async ({page})=>{
 const first=page.locator("#market-grid .market-card").first();
 await expect(first.locator(".market-freshness")).toContainText("Seen by provider");
 const link=first.getByRole("link",{name:/Flag a listing concern/});
 await expect(link).toHaveAttribute("href",/github\.com\/Esoham\/ApartmentFinder\/issues\/new/);
 await expect(link).toHaveAttribute("target","_blank");
 await first.getByRole("button",{name:"View full details"}).click();
 await expect(page.locator("#rental-detail-content")).toContainText("An account is required");
});

test("beta feedback remains on-site until user chooses to submit",async ({page})=>{
  await page.locator("#feedback-result").fill("The rental comparison page is hard to navigate on my phone.");
  await page.getByRole("button",{name:"Prepare report"}).click();
  await expect(page.locator("#feedback-preview")).toContainText("rental comparison page");
  await expect(page.locator("#feedback-status")).toContainText("Nothing has been submitted yet");
  await expect(page.locator("#feedback-submit-link")).toHaveAttribute("href",/github\.com\/Esoham\/ApartmentFinder\/issues\/new/);
  await page.locator("#feedback-result").fill("Edited report for checking changes");
  await expect(page.locator("#feedback-submit-link")).toBeHidden();
  await expect(page.locator("#feedback-copy")).toBeDisabled();
});

test("full cost-of-living planner updates with transportation and groceries",async ({page})=>{
 await page.locator("#market-grid .market-card").first().getByRole("button",{name:"Calculate my costs"}).click();
 await page.locator("#budget-income").fill("2600");
 await page.locator("#budget-utilities").fill("100");
 await page.locator("#budget-transportation").fill("250");
 await page.locator("#budget-groceries").fill("300");
 await page.locator("#budget-debtPayments").fill("100");
 await expect(page.locator("#budget-results")).toContainText("$1,650");
 await expect(page.locator("#budget-results")).toContainText("$950");
 await expect(page.locator("#budget-results")).toContainText("cash-flow estimate");
});

test("uncertain rental scope is visibly disclosed without claiming fraud",async ({page})=>{
 const now=new Date().toISOString();
 await page.route("**/data/live-listings.json",route=>route.fulfill({
  status:200,contentType:"application/json",
  body:JSON.stringify({provider:"RentCast",status:"ready",retrievedAt:now,items:[{
   id:"ambiguous",address:"100 Example Rd, Atlanta, GA",city:"Atlanta",state:"GA",zip:"30312",
   rent:625,beds:1,baths:1,sqft:1800,propertyType:"Single Family",status:"Active",
   lastSeenDate:now,officeName:"",officeWebsite:null
  }]})
 }));
 await page.reload();
 await expect(page.locator("#market-grid .market-card")).toHaveCount(0);
 await expect(page.locator("#market-ambiguity-note")).toContainText("1 potentially shared/room rental records hidden");
 await page.locator("#market-exclude-ambiguous").uncheck();
 const card=page.locator("#market-grid .market-card").first();
 await expect(card).toContainText("Rental scope unverified");
 await expect(card).toContainText("Direct listing contact not provided");
 await expect(card).not.toContainText("verified entire unit");
});

test("renter can include ambiguous listings and reset back to the safer default",async ({page})=>{
 const now=new Date().toISOString();
 await page.route("**/data/live-listings.json",route=>route.fulfill({
  status:200,contentType:"application/json",
  body:JSON.stringify({provider:"RentCast",status:"ready",retrievedAt:now,items:[
   {id:"room-risk",address:"1 Example Lane, Atlanta, GA",city:"Atlanta",state:"GA",zip:"30312",rent:600,beds:1,baths:1,propertyType:"Single Family",status:"Active",lastSeenDate:now},
   {id:"apartment",address:"2 Example Lane, Atlanta, GA",city:"Atlanta",state:"GA",zip:"30312",rent:900,beds:1,baths:1,propertyType:"Apartment",status:"Active",lastSeenDate:now}
  ]})
 }));
 await page.reload();
 await expect(page.locator("#market-exclude-ambiguous")).toBeChecked();
 await expect(page.locator("#market-grid .market-card")).toHaveCount(1);
 await page.locator("#market-exclude-ambiguous").uncheck();
 await expect(page.locator("#market-grid .market-card")).toHaveCount(2);
 await page.locator("#market-reset").click();
 await expect(page.locator("#market-exclude-ambiguous")).toBeChecked();
 await expect(page.locator("#market-grid .market-card")).toHaveCount(1);
});

test("sourced room rental displays the original public description and clear limitations",async ({page})=>{
 const now=new Date().toISOString();
 await page.route("**/data/live-listings.json",route=>route.fulfill({
  status:200,contentType:"application/json",
  body:JSON.stringify({provider:"RentCast",status:"ready",retrievedAt:now,items:[{
   id:"3865-Cypress-Pointe-Dr,-Union-City,-GA-30291",
   address:"3865 Cypress Pointe Dr, Union City, GA 30291",city:"Union City",state:"GA",zip:"30291",
   rent:600,beds:1,baths:1,propertyType:"Single Family",status:"Active",lastSeenDate:now
  }]})
 }));
 await page.reload();
 await expect(page.locator("#market-grid .market-card")).toHaveCount(0);
 await page.locator("#market-exclude-ambiguous").uncheck();
 const card=page.locator("#market-grid .market-card").first();
 await expect(card).toContainText("External listing identifies room rental");
 const link=card.getByRole("link",{name:/Read source: Zillow/});
 await expect(link).toHaveAttribute("href",/zillow\.com\/homedetails/);
 await expect(card).toContainText("current price and availability remain unverified");
 await card.getByRole("button",{name:"View full details"}).click();
 await expect(page.locator("#rental-detail-content")).toContainText("External listing identifies room rental");
});

test("city shortcuts are clickable, filter real rentals and stay synchronized",async ({page})=>{
 const shortcuts=page.locator("#market-city-shortcuts");
 await expect(shortcuts.getByRole("button",{name:"Atlanta"})).toBeVisible();
 await shortcuts.getByRole("button",{name:"College Park"}).click();
 await expect(page.locator("#market-city")).toHaveValue("College Park");
 await expect(shortcuts.getByRole("button",{name:"College Park"})).toHaveAttribute("aria-pressed","true");
 await expect(page.locator("#market-grid .market-card")).toHaveCount(1);
 await page.locator("#market-city").selectOption("Atlanta");
 await expect(shortcuts.getByRole("button",{name:"Atlanta"})).toHaveAttribute("aria-pressed","true");
 await expect(page.locator("#market-grid .market-card")).toHaveCount(3);
 await page.locator("#market-reset").click();
 await expect(shortcuts.getByRole("button",{name:"All areas"})).toHaveAttribute("aria-pressed","true");
 await expect(page.locator("#market-grid .market-card")).toHaveCount(4);
});

test("mobile navigation remains visible and functional",async ({page,isMobile})=>{
 if(!isMobile)test.skip();
 const nav=page.getByRole("navigation",{name:"Primary navigation"});
 await expect(nav).toBeVisible();
 await expect(nav.getByRole("link",{name:"Actual rentals"})).toBeVisible();
 await expect(nav.getByRole("link",{name:"Compare rentals"})).toBeVisible();
 await nav.getByRole("link",{name:"Actual rentals"}).click();
 await expect(page).toHaveURL(/#market-search$/);
});

test("address and price open the on-site property dialog",async ({page})=>{
 const card=page.locator("#market-grid .market-card").first();
 await card.getByRole("button",{name:/View details: 100 Sample Street/}).click();
 await expect(page.locator("#rental-detail-dialog")).toBeVisible();
 await page.getByRole("button",{name:"Close property details"}).click();
 await card.getByRole("button",{name:/View rental details for 100 Sample Street/}).click();
 await expect(page.locator("#rental-detail-dialog")).toBeVisible();
});

test("all ten metro areas are selectable and empty cities explain missing data",async ({page})=>{
 const cities=["Atlanta","College Park","East Point","Hapeville","Union City","Decatur","Smyrna","Marietta","Sandy Springs","Forest Park"];
 for(const city of cities)await expect(page.locator("#market-city option").filter({hasText:city})).toHaveCount(1);
 await page.locator("#market-city").selectOption("Sandy Springs");
 await expect(page.locator("#market-grid")).toContainText("We're expanding into Sandy Springs");
 await expect(page.locator("#market-grid .market-card")).toHaveCount(0);
 await page.locator("#market-grid").getByRole("button",{name:"Explore all areas"}).click();
 await expect(page.locator("#market-grid .market-card")).toHaveCount(4);
 await page.locator("#market-city-shortcuts").getByRole("button",{name:/Forest Park/}).click();
 await expect(page.locator("#market-grid")).toContainText("We're expanding into Forest Park");
});

test("property details expose the actual verification caveat, costs and actions",async ({page})=>{
 await page.locator("#market-grid .market-card").first().getByRole("button",{name:"View full details"}).click();
 const dialog=page.locator("#rental-detail-dialog");
 await expect(dialog).toContainText("Advertised monthly rent");
 await expect(dialog).toContainText("Not independently verified");
 await expect(dialog).toContainText("fees unknown");
 await expect(dialog).toContainText("What would this rental actually cost?");
 await dialog.getByRole("button",{name:/Save rental/}).click();
 await expect(dialog.getByRole("button",{name:/Saved/})).toHaveAttribute("aria-pressed","true");
 await expect(dialog.getByRole("link",{name:/Explore neighborhood map/})).toHaveAttribute("href",/maps\/search/);
 await dialog.getByRole("button",{name:/Compare rental/}).click();
 await expect(dialog).toBeHidden();
 await expect(page.locator("#real-compare-head th")).toHaveCount(2);
});
