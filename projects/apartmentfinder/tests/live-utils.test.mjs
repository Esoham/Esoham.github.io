import test from "node:test";
import assert from "node:assert/strict";
import { validateSnapshot, filterProviderListings, trustedOfficeUrl } from "../live-utils.mjs";
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
