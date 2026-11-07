import test from "node:test";
import assert from "node:assert/strict";
import { SAMPLE_LISTINGS } from "../listings.mjs";
import { moveInCost, monthlyEstimate, filterHomes, normalizeBound, sortHomes, money, selectCompare } from "../logic.mjs";

test("fictional dataset has eight unique stable IDs", () => {
  assert.equal(SAMPLE_LISTINGS.length, 8);
  assert.equal(new Set(SAMPLE_LISTINGS.map(x => x.id)).size, SAMPLE_LISTINGS.length);
});

test("every sample includes consistent nonnegative numeric cost fields", () => {
  for (const home of SAMPLE_LISTINGS) {
    for (const key of ["rent", "deposit", "applicationFee", "adminFee", "estimatedUtilities", "parkingFee", "petRent"])
      assert.ok(Number.isSafeInteger(home[key]) && home[key] >= 0, home.id + " " + key);
    assert.match(home.id, /^demo-/);
    assert.ok(home.name.startsWith("Sample "), home.id);
  }
});

test("maximum rent boundary is inclusive and no input means unlimited", () => {
  assert.equal(filterHomes(SAMPLE_LISTINGS, {maxRent: 780}).length, 1);
  assert.equal(filterHomes(SAMPLE_LISTINGS, {maxRent: 779}).length, 0);
  assert.equal(filterHomes(SAMPLE_LISTINGS, {maxRent: ""}).length, 8);
  assert.equal(filterHomes(SAMPLE_LISTINGS, {maxRent: 0}).length, 0);
});

test("bedroom filtering excludes studios correctly", () => {
  const homes = filterHomes(SAMPLE_LISTINGS, {minBeds: 2});
  assert.equal(homes.length, 3);
  assert.ok(homes.every(x => x.beds >= 2));
});

test("city and ZIP filters combine, ignoring city capitalization and surrounding whitespace", () => {
  const homes = filterHomes(SAMPLE_LISTINGS, {city: "  COLLEGE PARK ", zip: "30349"});
  assert.deepEqual(homes.map(x => x.id), ["demo-06"]);
  assert.equal(filterHomes(SAMPLE_LISTINGS, {zip: "303"}).length, 5);
});

test("pet-friendly filter excludes unsupported listings", () => {
  const homes = filterHomes(SAMPLE_LISTINGS, {petFriendly: true});
  assert.equal(homes.length, 4);
  assert.ok(homes.every(x => x.petFriendly));
});

test("saved-only search uses IDs rather than trusting property names", () => {
  assert.deepEqual(filterHomes(SAMPLE_LISTINGS, {savedOnly:true,savedIds:new Set(["demo-01","invalid"])}).map(x=>x.id), ["demo-01"]);
});

test("move-in formula includes first month of rent, deposit, application and admin fees", () => {
  assert.equal(moveInCost(SAMPLE_LISTINGS[0]), 1380);
  assert.equal(moveInCost(SAMPLE_LISTINGS[1]), 1675);
});

test("monthly estimate includes optional parking and optional pet rent", () => {
  assert.equal(monthlyEstimate(SAMPLE_LISTINGS[2]), 1035);
  assert.equal(monthlyEstimate(SAMPLE_LISTINGS[1], false), 1115);
  assert.equal(monthlyEstimate(SAMPLE_LISTINGS[1], true), 1140);
});

test("maximum move-in filter is inclusive and independent of rent", () => {
  assert.deepEqual(filterHomes(SAMPLE_LISTINGS, {maxMoveIn:1205}).map(x=>x.id), ["demo-08"]);
  assert.equal(filterHomes(SAMPLE_LISTINGS, {maxMoveIn:1204}).length, 0);
});

test("sorting is ascending, deterministic and does not mutate inputs", () => {
  const orig = SAMPLE_LISTINGS.map(x=>x.id);
  assert.equal(sortHomes(SAMPLE_LISTINGS, "rent")[0].id, "demo-08");
  assert.equal(sortHomes(SAMPLE_LISTINGS, "moveIn")[0].id, "demo-08");
  assert.deepEqual(SAMPLE_LISTINGS.map(x=>x.id), orig);
});

test("three-home comparison limit and toggle-off semantics", () => {
  const initial = new Set(["demo-01","demo-02","demo-03"]);
  const rejected = selectCompare(initial,"demo-04");
  assert.equal(rejected.limited,true);
  assert.equal(rejected.ids.size,3);
  const removed = selectCompare(initial,"demo-02");
  assert.equal(removed.limited,false);
  assert.equal(removed.ids.size,2);
  assert.equal(initial.size,3);
});

test("invalid and blank bounds handled without an accidental zero budget", () => {
  assert.equal(normalizeBound(""), null);
  assert.equal(normalizeBound("   "), null);
  assert.equal(normalizeBound("-1"), null);
  assert.equal(normalizeBound("bad"), null);
  assert.equal(normalizeBound("0"), 0);
});

test("money formatting is stable for an estimated US-dollar total", () => {
  assert.equal(money(1205), "$1,205");
});
