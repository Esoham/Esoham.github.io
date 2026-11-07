import { test, expect } from "@playwright/test";

test("outbound rental data failure keeps the demo and budget planner usable", async ({page}) => {
  await page.route("**/data/live-listings.json", route => route.fulfill({
    status:503, contentType:"application/json",body:JSON.stringify({error:"temporarily unavailable"})
  }));
  await page.goto("/");
  await expect(page.locator("#market-status")).toContainText("Rental feed unavailable");
  await expect(page.locator("#listing-grid .listing-card")).toHaveCount(8);
  await page.locator("#budget-rent").fill("950");
  await expect(page.locator("#budget-results")).toContainText("$950");
});

test("stale rentals are hidden instead of misrepresented as currently active", async ({page}) => {
  await page.route("**/data/live-listings.json", route => route.fulfill({
    status:200,contentType:"application/json",
    body:JSON.stringify({provider:"RentCast",status:"ready",retrievedAt:"2020-01-01T00:00:00Z",
      items:[{id:"old",address:"Old Example",city:"Atlanta",state:"GA",rent:700,status:"Active",
        lastSeenDate:"2020-01-01T00:00:00Z"}]})
  }));
  await page.goto("/");
  await expect(page.locator("#market-status")).toContainText("too old to display");
  await expect(page.locator("#market-grid .market-card")).toHaveCount(0);
});

test("sample Compare visibly leads to sample comparison table", async ({page})=>{
  await page.goto("/");
  const first=page.locator("#listing-grid .listing-card").first();
  await first.getByRole("button",{name:/Compare/}).click();
  await expect(page.locator("#compare-table-wrap")).toBeVisible();
  await expect(page.locator("#compare-head th")).toHaveCount(2);
  await expect(page.locator("#compare-instruction")).toContainText("1 of 3");
  await page.getByRole("button",{name:"Clear comparison"}).click();
  await expect(page.locator("#compare-table-wrap")).toBeHidden();
});

test("real property details dialog responds to Escape",async ({page})=>{
  const now=new Date().toISOString();
  await page.route("**/data/live-listings.json",route=>route.fulfill({
    status:200,contentType:"application/json",
    body:JSON.stringify({provider:"RentCast",status:"ready",retrievedAt:now,items:[{
      id:"one",address:"100 Sample Street, Atlanta, GA 30312",city:"Atlanta",state:"GA",
      zip:"30312",rent:900,beds:1,baths:1,propertyType:"Apartment",status:"Active",lastSeenDate:now
    }]})
  }));
  await page.goto("/");
  await page.locator("#market-grid").getByRole("button",{name:"View full details"}).click();
  await expect(page.locator("#rental-detail-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#rental-detail-dialog")).toBeHidden();
});
