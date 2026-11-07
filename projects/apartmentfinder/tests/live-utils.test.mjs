import test from "node:test";
import assert from "node:assert/strict";
import { validateSnapshot, filterProviderListings, trustedOfficeUrl, hasAmbiguousRentalScope, estimateRenterCosts, toggleRentalComparison, compareRentalFacts } from "../live-utils.mjs";
const NOW = new Date("2026-11-07T13:00:00Z");
const ITEM = {id:"a",address:"Test Address, Atlanta, GA",city:"Atlanta",state:"GA",rent:1000,beds:1,baths:1,
 lastSeenDate:"2026-11-06T12:00:00Z",status:"Active",officeWebsite:"https://example.com"};
const sample = () => ({ provider:"RentCast",status:"ready",retrievedAt:"2026-11-07T12:00:00Z",items:[ITEM]});
test("not configured snapshot must not show simulated data as rentals",()=>{
 assert.equal(validateSnapshot({provider:"RentCast",status:"not_configured",items:[]},NOW).state,"not_configured");
});
test("ready snapshot accepts fresh active rental",()=>{
 const v=validateSnapshot(sample(),NOW);
 assert.equal(v.state,"ready");assert.equal(v.items.length,1);
});
test("stale or future snapshot is hidden",()=>{
 assert.equal(validateSnapshot({...sample(),retrievedAt:"2026-10-01T12:00:00Z"},NOW).state,"stale");
 assert.equal(validateSnapshot({...sample(),retrievedAt:"2026-11-09T12:00:00Z"},NOW).state,"stale");
});
test("inactive, old, and fake rental entries are filtered",()=>{
 const other={...ITEM,id:"b",status:"Inactive"};
 const old={...ITEM,id:"c",lastSeenDate:"2026-10-02T12:00:00Z"};
 const bogus={...ITEM,id:"d",rent:"950"};
 const v=validateSnapshot({...sample(),items:[other,old,bogus]},NOW);
 assert.equal(v.state,"empty");assert.equal(v.items.length,0);
});
test("provider filters enforce city, rent boundary and minimum bedrooms",()=>{
 const items=[ITEM,{...ITEM,id:"b",city:"College Park",rent:875,beds:0},
 {...ITEM,id:"c",rent:1100,beds:null}];
 assert.deepEqual(filterProviderListings(items,{city:"atlanta",maxRent:1000,minBeds:1}).map(x=>x.id),["a"]);
 assert.deepEqual(filterProviderListings(items,{maxRent:875,minBeds:0}).map(x=>x.id),["b"]);
});
test("blank rent maximum is unlimited and zero remains real boundary",()=>{
 assert.equal(filterProviderListings([ITEM],{maxRent:""}).length,1);
 assert.equal(filterProviderListings([ITEM],{maxRent:"0"}).length,0);
});
test("unsafe office links rejected",()=>{
 assert.equal(trustedOfficeUrl("javascript:alert(1)"),null);
 assert.equal(trustedOfficeUrl("http://example.com"),null);
 assert.equal(trustedOfficeUrl("https://example.com/"),"https://example.com/");
});
test("malformed snapshot rejected",()=>{
 assert.equal(validateSnapshot({},NOW).state,"invalid");
 assert.equal(validateSnapshot(null,NOW).state,"invalid");
});

test("ZIP and property type filters narrow provider results",()=>{
 const items=[{...ITEM,zip:"30337",propertyType:"Apartment"}, {...ITEM,id:"b",zip:"30349",propertyType:"Single Family"}];
 assert.deepEqual(filterProviderListings(items,{zip:"30337"}).map(x=>x.id),["a"]);
 assert.deepEqual(filterProviderListings(items,{propertyType:"single family"}).map(x=>x.id),["b"]);
 assert.deepEqual(filterProviderListings(items,{zip:"30337",propertyType:"Single Family"}),[]);
});
test("single-family one-bedroom listings carry ambiguity warning",()=>{
 assert.equal(hasAmbiguousRentalScope({propertyType:"Single Family",beds:1}),true);
 assert.equal(hasAmbiguousRentalScope({propertyType:"Apartment",beds:1}),false);
 assert.equal(hasAmbiguousRentalScope({propertyType:"Single Family",beds:3}),false);
});

test("renter planner sums only entered expenses",()=>{
 const v=estimateRenterCosts({rent:800,income:2600,utilities:130,otherMonthly:50,deposit:400,applicationFee:65,adminFee:0,otherUpfront:100});
 assert.equal(v.valid,true);assert.equal(v.monthly,980);assert.equal(v.upfront,1365);assert.equal(v.remaining,1620);
});
test("planner rejects negative, invalid and missing rent",()=>{
 assert.equal(estimateRenterCosts({rent:-5,income:1600}).valid,false);
 assert.equal(estimateRenterCosts({rent:800,income:"bad"}).valid,false);
 assert.equal(estimateRenterCosts({rent:0,income:1800}).valid,false);
});
test("planner with no income avoids misleading affordability ratio",()=>{
 const v=estimateRenterCosts({rent:850,income:0});
 assert.equal(v.rentPercent,null);assert.equal(v.remaining,null);
});

test("real listings comparison adds and removes up to three choices",()=>{
 let ids=[];
 for(const id of ["a","b","c"]){const r=toggleRentalComparison(ids,id);assert.equal(r.limited,false);ids=r.ids;}
 assert.deepEqual(ids,["a","b","c"]);
 const over=toggleRentalComparison(ids,"d");
 assert.equal(over.limited,true);assert.deepEqual(over.ids,ids);
 assert.deepEqual(toggleRentalComparison(ids,"b").ids,["a","c"]);
});
test("real listing comparison does not include missing or invented listings",()=>{
 const list=[ITEM,{...ITEM,id:"b",rent:1100}];
 assert.deepEqual(compareRentalFacts(list,["b","missing","a"]).map(i=>i.id),["b","a"]);
});
test("duplicate compare selection is not added twice",()=>{
 assert.deepEqual(toggleRentalComparison(["a","a"],"b").ids,["a","b"]);
});

test("living cost model includes transport, food, debt and essentials",()=>{
 const result=estimateRenterCosts({rent:900,income:2700,utilities:150,otherMonthly:40,
  transportation:230,groceries:300,debtPayments:120,otherEssentials:80,
  deposit:450,applicationFee:60});
 assert.equal(result.valid,true);
 assert.equal(result.monthly,1090);
 assert.equal(result.essentials,730);
 assert.equal(result.livingTotal,1820);
 assert.equal(result.livingRemaining,880);
 assert.equal(result.upfront,1410);
});
test("living cost model reports negative cash flow without hiding it",()=>{
 const v=estimateRenterCosts({rent:1200,income:1400,transportation:350,groceries:300});
 assert.equal(v.livingRemaining,-450);
 assert.equal(v.valid,true);
});
test("living cost model rejects negative essential expenses",()=>{
 assert.equal(estimateRenterCosts({rent:800,income:2000,transportation:-1}).valid,false);
 assert.equal(estimateRenterCosts({rent:800,income:2000,groceries:"invalid"}).valid,false);
});
