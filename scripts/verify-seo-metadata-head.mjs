// Read-only complete-response check. No database access or mutation. Use --audit
// to record pre-fix placement without treating streamed metadata as missing.
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const decode=value=>value.replace(/&(?:amp|lt|gt|quot|apos|#39|#x[0-9a-f]+|#\d+);/gi,entity=>{
 const named={"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&apos;":"'","&#39;":"'"};
 return named[entity.toLowerCase()] ?? String.fromCodePoint(entity[2].toLowerCase()==="x"?parseInt(entity.slice(3,-1),16):parseInt(entity.slice(2,-1),10));
});
export function inspectMetadataHtml(source) {
 const clean=source.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,"").replace(/<!--[\s\S]*?-->/g,"");
 const head=clean.match(/<head(?:\s[^>]*)?>([\s\S]*?)<\/head\s*>/i)?.[1]??"";
 const attributes=tag=>Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(([,key,a,b,c])=>[key.toLowerCase(),decode(a??b??c)]));
 const tags=(html,kind)=>[...html.matchAll(new RegExp(`<${kind}\\b[^>]*>`,"gi"))].map(match=>attributes(match[0]));
 const titles=html=>[...html.matchAll(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title\s*>/gi)].map(match=>decode(match[1]));
 const metas=tags(clean,"meta");const links=tags(clean,"link");
 return {titles:titles(clean),headTitles:titles(head),descriptions:metas.filter(tag=>tag.name==="description").map(tag=>tag.content),headDescriptions:tags(head,"meta").filter(tag=>tag.name==="description").map(tag=>tag.content),canonical:links.filter(tag=>tag.rel==="canonical").map(tag=>tag.href),icons:links.filter(tag=>tag.rel?.split(/\s+/).includes("icon")).map(tag=>tag.href),robots:metas.find(tag=>tag.name==="robots")?.content,openGraph:Object.fromEntries(metas.filter(tag=>tag.property?.startsWith("og:")).map(tag=>[tag.property,tag.content])),twitter:Object.fromEntries(metas.filter(tag=>tag.name?.startsWith("twitter:")).map(tag=>[tag.name,tag.content]))};
}
const expectedTitle="Auto Eighteen - Pusat Jual Beli Mobil Bekas Berkualitas Dan Bergaransi";
const expectedDescription="Auto Eighteen adalah pusat jual beli mobil bekas berkualitas dan bergaransi. Melayani pembelian Cash, Credit & Trade In. Cari mobil impian Anda hanya di Auto18.";
export async function verifyMetadataResponses(base, vehiclePath, audit=false) {
 assert(["http:","https:"].includes(base.protocol)&&!base.username&&!base.password&&base.pathname==="/");
 assert(/^\/cars\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(vehiclePath),"Supply an existing AVAILABLE vehicle path.");
 const agents={browser:"Mozilla/5.0 Chrome/131.0.0.0 Safari/537.36",googlebot:"Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",twitterbot:"Twitterbot/1.0"};
 const results=[];
 for(const path of ["/","/cars",vehiclePath])for(const [agent,userAgent]of Object.entries(agents)){
  const start=performance.now();const response=await fetch(new URL(path,base),{headers:{"User-Agent":userAgent},signal:AbortSignal.timeout(30000)});const headersMs=performance.now()-start;
  const html=await response.text();const totalMs=performance.now()-start;const metadata=inspectMetadataHtml(html);
  assert.equal(response.status,200,`${agent} ${path}: status`);assert.equal(metadata.titles.length,1);assert.equal(metadata.descriptions.length,1);
  assert(metadata.titles[0]?.trim()&&metadata.descriptions[0]?.trim());
  if(!audit){assert.equal(metadata.headTitles.length,1,`${agent} ${path}: title must be in head`);assert.equal(metadata.headDescriptions.length,1,`${agent} ${path}: description must be in head`);}
  if(path==="/"){assert.equal(metadata.titles[0],expectedTitle);assert.equal(metadata.descriptions[0],expectedDescription);}
  else assert.notEqual(metadata.titles[0],expectedTitle,"Homepage metadata must not override other pages");
  assert.equal(metadata.canonical.length,1);assert.equal(new URL(metadata.canonical[0]).pathname,path);assert(metadata.icons.length>0);assert(metadata.robots);assert.equal(metadata.openGraph["og:title"],metadata.titles[0]);assert.equal(metadata.twitter["twitter:title"],metadata.titles[0]);
  results.push({path,agent,status:response.status,headersMs:Math.round(headersMs),totalMs:Math.round(totalMs),...metadata});
 }
 return results;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const base=new URL(process.env.SEO_HTTP_BASE_URL||"http://127.0.0.1:3137");
 verifyMetadataResponses(base,process.env.SEO_HTTP_VEHICLE_PATH||"/cars/seo-fixture-car",process.argv.includes("--audit")).then(results=>console.log(JSON.stringify(results,null,2))).catch(error=>{console.error(error.message);process.exitCode=1;});
}
