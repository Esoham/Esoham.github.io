import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { trustedOfficeUrl } from "../live-utils.mjs";

const root=join(dirname(fileURLToPath(import.meta.url)),"..");
const html=readFileSync(join(root,"index.html"),"utf8");
const sourceFiles=["live.mjs","feedback.mjs","app.mjs","logic.mjs","live-utils.mjs"];
const sources=sourceFiles.map(file=>readFileSync(join(root,file),"utf8"));

test("static document enforces a restrictive content security policy",()=>{
  const policy=html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/)?.[1];
  assert.ok(policy,"Missing static-site CSP");
  for(const directive of ["default-src 'none'","script-src 'self'","connect-src 'self'","object-src 'none'","base-uri 'none'","form-action 'none'"]){
    assert.ok(policy.includes(directive),"Missing CSP directive: "+directive);
  }
  assert.doesNotMatch(policy,/unsafe-inline|unsafe-eval|\*/);
});

test("external links in HTML cannot control the original tab",()=>{
  for(const match of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)){
    assert.match(match[0],/rel="[^"]*noopener[^"]*"/);
    assert.match(match[0],/rel="[^"]*noreferrer[^"]*"/);
  }
});

test("browser source does not inject provider strings as HTML or embed secrets",()=>{
  for(const code of sources){
    assert.doesNotMatch(code,/\.innerHTML\s*=|\.outerHTML\s*=|document\.write\(|\beval\s*\(|new Function\s*\(/);
    assert.doesNotMatch(code,/RENTCAST_API_KEY|X-Api-Key|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/);
  }
});

test("reject unsafe external URLs including localhost and IP literals",()=>{
  const bad=["javascript:alert(1)","http://example.org","https://localhost:443/",
    "https://127.0.0.1/path","https://192.168.1.1/","https://[::1]/",
    "https://staff.internal/","https://site.local/","https://user:pass@example.org/",
    "https://example.org:8080/","https://example.org/\nheader"];
  for(const url of bad)assert.equal(trustedOfficeUrl(url),null,url);
  assert.equal(trustedOfficeUrl("https://leasing.example.org/units"),"https://leasing.example.org/units");
});
