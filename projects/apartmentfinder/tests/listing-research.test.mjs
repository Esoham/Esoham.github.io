import test from "node:test";
import assert from "node:assert/strict";
import { LISTING_RESEARCH } from "../listing-research.mjs";
import { trustedOfficeUrl } from "../live-utils.mjs";

test("manually checked rental scope has an explicit source and review date",()=>{
 const values=Object.values(LISTING_RESEARCH);
 assert.ok(values.length>=5);
 for(const entry of values){
  assert.equal(entry.scope,"room-advertised");
  assert.equal(typeof entry.sourceName,"string");
  assert.ok(entry.note.length>20);
  assert.match(entry.checkedOn,/^\d{4}-\d{2}-\d{2}$/);
  assert.ok(trustedOfficeUrl(entry.sourceUrl),"Only HTTPS source pages can be displayed");
 }
});
test("public source notes must not state that a unit is verified or available",()=>{
 for(const item of Object.values(LISTING_RESEARCH)){
  assert.doesNotMatch(item.note,/verified available|guaranteed|certified whole|book now/i);
 }
});
