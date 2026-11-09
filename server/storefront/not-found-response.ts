import { NextResponse } from "next/server";

// A fixed, data-free response avoids internal rewrite proxying when TLS is
// terminated upstream. No request headers, titles, records or URLs are embedded.
const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Halaman tidak ditemukan</title><style>body{margin:0;background:#09090b;color:#fff;font:16px system-ui,sans-serif}main{min-height:100vh;display:grid;place-content:center;text-align:center;padding:24px;box-sizing:border-box}h1{font-size:clamp(1.8rem,5vw,2.5rem)}p{color:#a1a1aa}a{display:inline-block;margin-top:20px;padding:14px 22px;background:#dc2626;color:white;border-radius:12px;text-decoration:none}a:focus-visible{outline:3px solid white;outline-offset:4px}</style></head><body><main><p>404</p><h1>Halaman tidak ditemukan</h1><p>Alamat yang kamu buka tidak tersedia.</p><a href="/">Kembali ke beranda</a></main></body></html>`;
export function publicNotFoundResponse(bodyless: boolean) {
 const response=new NextResponse(bodyless?null:html,{status:404,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"private, no-store, max-age=0","X-Robots-Tag":"noindex, nofollow"}});
 return response;
}
