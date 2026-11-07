import { readFileSync, writeFileSync } from "node:fs";
import { auditRentalSnapshot } from "../live-utils.mjs";

const snapshot=JSON.parse(readFileSync(new URL("../data/live-listings.json",import.meta.url),"utf8"));
const audit=auditRentalSnapshot(snapshot);
const report=[
"# ApartmentFinder · automated data quality review","",
"Automated checks do **not** verify unit availability, pricing, rental scope, ownership, or legitimacy.",
"",
"Snapshot status: "+audit.state,
"Active records considered: "+audit.total,
"Records with at least one review flag: "+audit.review.length,
"",
"## Flags",
...Object.entries(audit.counts).map(([k,v])=>"- "+k+": "+v),
"",
"## Manual review queue",
"| Address | Advertised rent | Review flags |",
"| --- | ---: | --- |",
...audit.review.map(x=>"| "+x.address.replaceAll("|","/")+" | $"+x.rent.toLocaleString("en-US")+" | "+x.flags.join(", ")+" |"),
"",
"Review independently with an official property listing or authorized leasing representative. Do not present automated results as verified."
].join("\n");
writeFileSync(new URL("../listing-quality-report.md",import.meta.url),report+"\n");
console.log("Rental quality report written: "+audit.total+" records, "+audit.review.length+" flagged");
if(audit.state!=="ready")console.log("Snapshot isn't current; audit cannot validate listings.");
