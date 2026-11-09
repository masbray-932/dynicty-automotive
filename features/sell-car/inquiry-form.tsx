"use client";
import { useState, useSyncExternalStore } from "react";
import { buildSellCarWhatsapp, sellCarSchema } from "./domain";
import { normalizeWhatsappNumber } from "@/features/homepage/domain";
const subscribe=()=>()=>{};
const control="public-control w-full px-3 py-2 focus-visible:outline-2 focus-visible:outline-brand-focus";
export function SellCarInquiry({number}:{number:string|null}) {
 const ready=useSyncExternalStore(subscribe,()=>true,()=>false);
 const [errors,setErrors]=useState<Record<string,string[]|undefined>>({});const [href,setHref]=useState<string|null>(null);
 if(!normalizeWhatsappNumber(number))return <p role="status" className="mt-6">WhatsApp showroom belum tersedia. Gunakan informasi di halaman Kontak Kami.</p>;
 return <form noValidate className="mt-8 grid gap-5 sm:grid-cols-2" onChange={()=>setHref(null)} onSubmit={event=>{event.preventDefault();const values=Object.fromEntries(new FormData(event.currentTarget));const parsed=sellCarSchema().safeParse(values);if(!parsed.success){setErrors(parsed.error.flatten().fieldErrors);setHref(null);return;}setErrors({});setHref(buildSellCarWhatsapp(number,parsed.data));}}>
 <fieldset disabled={!ready} className="contents">
 {([['name','Nama Anda','text'],['contact','Nomor kontak','tel'],['brand','Merek kendaraan','text'],['model','Model kendaraan','text'],['year','Tahun produksi','number'],['transmission','Transmisi','select'],['mileage','Jarak tempuh (km)','number'],['price','Harga jual yang diharapkan (Rp)','number'],['notes','Catatan opsional','textarea']] as const).map(([name,label,type])=><div key={name} className={name==='notes'?'grid gap-2 sm:col-span-2':'grid gap-2'}><label htmlFor={`sell-${name}`}>{label}</label>{type==='select'?<select id={`sell-${name}`} name={name} className={control} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name]?`sell-${name}-error`:undefined}><option value="">Pilih transmisi</option><option>Manual</option><option>Automatic</option></select>:type==='textarea'?<textarea id={`sell-${name}`} name={name} className={control} maxLength={2000} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name]?`sell-${name}-error`:undefined}/>:<input id={`sell-${name}`} name={name} type={type} className={control} maxLength={name==='name'||name==='model'?100:name==='brand'?80:30} required min={type==='number'?0:undefined} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name]?`sell-${name}-error`:undefined}/>} {errors[name]?<p id={`sell-${name}-error`} className="text-sm text-red-300">{errors[name]?.join(' ')}</p>:null}</div>)}
 <p className="text-sm leading-6 text-[#606060] sm:col-span-2">Data hanya digunakan di perangkat ini untuk menyusun pesan. Tinjau pesan di WhatsApp dan kirim jika Anda setuju. Website ini tidak menyimpan data inquiry.</p>
 <button className="min-h-11 rounded bg-brand-primary px-5 font-bold text-brand-on-primary focus-visible:outline-2 focus-visible:outline-brand-focus">Siapkan pesan WhatsApp</button>
 {Object.keys(errors).length?<p role="alert">Periksa field yang ditandai.</p>:null}
 {href?<a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded border border-[#171717] px-5 focus-visible:outline-2 focus-visible:outline-brand-focus">Buka WhatsApp untuk meninjau pesan</a>:null}
 </fieldset>
 </form>;
}
