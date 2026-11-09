// Read-only browser regression against an explicitly confirmed LOCAL demo.
// Install Playwright separately or supply its absolute module path; no runtime
// dependency or production deployment configuration is added to the app.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require=createRequire(import.meta.url);
assert.equal(process.env.PUBLIC_QA_DISPOSABLE,"true","Explicitly confirm disposable demo QA.");
const base=new URL(process.env.PUBLIC_QA_BASE_URL || "https://127.0.0.1:8443");
assert(["https:","http:"].includes(base.protocol) && ["127.0.0.1","localhost","[::1]"].includes(base.hostname) && !base.username && !base.password && base.pathname==="/","Only a loopback disposable origin is supported.");
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE_PATH?{executablePath:process.env.BROWSER_EXECUTABLE_PATH}:{}),args:["--no-sandbox","--no-proxy-server"]});
try{
 const context=await browser.newContext({ignoreHTTPSErrors:process.env.PUBLIC_QA_ALLOW_SELF_SIGNED==="true",viewport:{width:1280,height:900}});
 const page=await context.newPage();page.setDefaultTimeout(15000);
 await page.goto(base.href,{waitUntil:"networkidle"});
 assert((await page.getByRole("heading",{level:1}).textContent()).includes("Dynicty Auto Demo"),"Expected fictional demo installation.");
 const form=page.locator('form[action="/cars"]');
 assert.equal(await form.getAttribute("method"),"get");
 assert.deepEqual(await form.locator("input,select").evaluateAll(nodes=>nodes.map(node=>node.name)),["condition","brand","model","q","minPrice","maxPrice"]);
 console.log("PASS 1: exact six fields and native GET /cars");
 await form.locator('[name=brand]').selectOption("toyota");await form.locator('[name=model]').selectOption("avanza");
 await form.locator('[name=brand]').selectOption("honda");assert.equal(await form.locator('[name=model]').inputValue(),"");assert(!(await form.locator('[name=model] option').allTextContents()).includes("Avanza"));
 console.log("PASS 2: brand change resets model and excludes previous-brand options");
 const values={condition:"NEW",brand:"toyota",model:"avanza",q:"Demo G 1",minPrice:"140000000",maxPrice:"140000000"};
 for(const name of ["condition","brand","model"])await form.locator(`[name=${name}]`).selectOption(values[name]);
 for(const name of ["q","minPrice","maxPrice"])await form.locator(`[name=${name}]`).fill(values[name]);
 await form.getByRole("button",{name:"Cari Mobil",exact:true}).click();await page.waitForURL(/\/cars\?/);await page.waitForLoadState("networkidle");
 const url=new URL(page.url());for(const [key,value]of Object.entries(values))assert.equal(url.searchParams.get(key),value,`Lost ${key}`);
 assert(await page.locator('a[href="/cars/demo-car-01"]').count()>0);assert.equal(await page.locator('a[href="/cars/demo-car-09"]').count(),0);
 console.log("PASS 3: six parameters round-trip; inclusive exact price and condition scope");
 await page.goto(new URL("/cars?condition=NEW&brand=toyota&model=avanza&q=Demo&minPrice=140000000&maxPrice=500000000",base).href,{waitUntil:"networkidle"});
 await page.getByLabel("Urutkan mobil").selectOption("price-asc");await page.getByRole("button",{name:"Urutkan",exact:true}).click();await page.waitForURL(/sort=price-asc/);await page.waitForLoadState("networkidle");
 const sorted=new URL(page.url());assert.equal(sorted.searchParams.get("sort"),"price-asc");for(const key of Object.keys(values))assert(sorted.searchParams.has(key),`Sorting lost ${key}`);
 console.log("PASS 4: sorting retains all six filters");
 await page.goto(new URL("/cars",base).href,{waitUntil:"networkidle"});await page.getByRole("navigation",{name:"Paginasi katalog"}).getByRole("link",{name:"Berikutnya"}).click();await page.waitForURL(/page=2/);await page.waitForLoadState("networkidle");assert.equal(new URL(page.url()).searchParams.get("page"),"2");assert.equal(await page.locator("main article").count(),2);
 console.log("PASS 5: server pagination shows remaining 2 of 14 AVAILABLE demo cars");
 await page.goto(new URL("/cars?minPrice=500000000&maxPrice=140000000",base).href,{waitUntil:"networkidle"});assert.equal(await page.locator('a[href="/cars/demo-car-15"],a[href="/cars/demo-car-16"]').count(),0);
 console.log("PASS 6: malformed price combination remains safe; DRAFT/SOLD excluded");
}finally{await browser.close();}
