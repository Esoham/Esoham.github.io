import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root=join(dirname(fileURLToPath(import.meta.url)),"..");
const html=readFileSync(join(root,"index.html"),"utf8");
const app=readFileSync(join(root,"app.mjs"),"utf8");
const live=readFileSync(join(root,"live.mjs"),"utf8");

function checkSelectors(source,label){
 const selectors=[...source.matchAll(/document\.querySelector\(["']#([a-zA-Z][\w-]*)["']\)/g)].map(match=>match[1]);
 const ids=new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]));
 const missing=[...new Set(selectors)].filter(id=>!ids.has(id));
 assert.deepEqual(missing,[],label+" references IDs absent from index.html");
}

test("every static app and provider DOM selector exists",()=>{
 checkSelectors(app,"sample app");
 checkSelectors(live,"real rental app");
});

test("real comparison has button, selected state, table, and clear callback",()=>{
 for(const id of ["real-compare","real-compare-status","real-compare-wrap","real-compare-head","real-compare-body","real-compare-clear"]){
  assert.match(html,new RegExp('id=["\\']'+id+'["\\']'));
 }
 assert.match(live,/toggleRentalComparison\(realComparison,item\.id\)/);
 assert.match(live,/renderRealComparison/);
 assert.match(live,/realCompareClear\.addEventListener\("click"/);
});

test("sample and real comparisons have distinct headings",()=>{
 assert.match(html,/id="real-compare-title">Compare real rental records/);
 assert.match(html,/id="compare-title">Compare fictional sample apartments/);
});

test("the provider credentials are not referenced in browser source",()=>{
 for(const code of [app,live]){
  assert.doesNotMatch(code,/RENTCAST_API_KEY|X-Api-Key/);
 }
});
