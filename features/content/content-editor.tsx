"use client";
import { useActionState, useEffect, useId, useState } from "react";
import type { DealerContent } from "@prisma/client";
import { ConfirmationForm } from "@/components/admin/confirmation-form";
import { profileConfirmation, contentConfirmation, criticalAction } from "@/features/admin/confirmation-policy";
import { FormField } from "@/components/ui/form-field";
import { emptyActionState } from "@/types/action-state";
import { saveDealerContentAction, saveContentItemAction, deleteContentItemAction } from "@/server/content/actions";
import { BannerCarousel } from "./banner-carousel";
import { isMediaKind, type ContentKind, type PublicContentItem } from "./domain";
const input = "w-full min-h-11 rounded-lg border border-white/20 bg-zinc-950 px-3 py-2 text-white focus-visible:outline-2 focus-visible:outline-brand-focus";
const button = "min-h-11 rounded-lg bg-brand-primary px-5 py-2 font-bold text-brand-on-primary disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-brand-focus";
function Status({message,errors}:{message:string;errors:Record<string,string[]|undefined>}) {return <div role="status" className="text-sm text-zinc-200"><p>{message}</p>{Object.entries(errors).map(([field,list])=>list?.length?<p key={field}>{list.join(" ")}</p>:null)}</div>;}
function Field({label,name,value="",multiline=false,max=200,error,type="text",min,maxValue}:{label:string;name:string;value?:string;multiline?:boolean;max?:number;error?:string;type?:"text"|"number";min?:number;maxValue?:number}) {const id=useId();return <FormField error={error} htmlFor={id} label={label}>{multiline?<textarea className={`${input} min-h-28`} name={name} defaultValue={value} maxLength={max} />:<input className={input} name={name} defaultValue={value} maxLength={type==="text"?max:undefined} max={maxValue} min={min} type={type} />}</FormField>;}
export function ProfileEditor({profile}:{profile:DealerContent|null}) {
  const [state,action,pending]=useActionState(saveDealerContentAction,emptyActionState);
  const showroomId=useId();
  return <ConfirmationForm action={action} confirmation={data => profileConfirmation(profile, data)} className="grid gap-5 rounded-2xl border border-white/10 bg-zinc-900 p-5">
    <h2 className="text-xl font-bold">Welcome & company profile</h2>
    <Field label="Judul welcome" name="welcomeTitle" value={profile?.welcomeTitle} max={150} error={state.errors.welcomeTitle?.[0]} />
    <Field label="Isi welcome" name="welcomeBody" value={profile?.welcomeBody} multiline max={2000} error={state.errors.welcomeBody?.[0]} />
    <label><input type="checkbox" name="welcomeActive" defaultChecked={profile?.welcomeActive} /> Tampilkan welcome</label>
    <Field label="Ringkasan tentang kami (Homepage)" name="aboutSummary" value={profile?.aboutSummary} multiline max={1500} error={state.errors.aboutSummary?.[0]} />
    <Field label="Cerita dealer (/about)" name="aboutStory" value={profile?.aboutStory} multiline max={12000} error={state.errors.aboutStory?.[0]} />
    <label><input type="checkbox" name="aboutActive" defaultChecked={profile?.aboutActive} /> Tampilkan tentang kami</label>
    <FormField error={state.errors.image?.[0]} htmlFor={showroomId} label="Foto showroom — JPEG/PNG/WEBP, maksimal 8 MB"><input type="file" name="image" accept="image/jpeg,image/png,image/webp" className={input} /></FormField>
    <Field label="Deskripsi foto showroom" name="showroomAlt" value={profile?.showroomAlt} error={state.errors.showroomAlt?.[0]} />
    {profile?.showroomKey ? <label><input type="checkbox" name="removeImage" /> Hapus foto showroom (upload baru menggantikan foto lama)</label>:null}
    <Field label="Jam operasional (faktual, kosong bila belum tersedia)" name="operatingHours" value={profile?.operatingHours} multiline max={1500} error={state.errors.operatingHours?.[0]} />
    <label><input type="checkbox" name="operatingHoursActive" defaultChecked={profile?.operatingHoursActive} /> Tampilkan jam operasional</label>
    <button type="submit" className={button} disabled={pending}>{pending?"Menyimpan…":"Simpan profile"}</button>
    <Status {...state} />
  </ConfirmationForm>;
}
function Preview({item,url}:{item:PublicContentItem;url:string|null}) {
  const [width,setWidth]=useState(390);
  return <div className="grid gap-2"><label className="grid gap-2">Preview perangkat<select className={input} value={width} onChange={e=>setWidth(Number(e.target.value))}><option value={390}>HP — 390px</option><option value={768}>Tablet — 768px</option><option value={1280}>Desktop — 1280px</option></select></label><div className="mx-auto w-full" style={{maxWidth:width}}><BannerCarousel slides={url?[{...item,mediaUrl:url}]:[]} previewWidth={width} label="Preview banner" /></div></div>;
}
export function ItemEditor({kind,item}:{kind:ContentKind;item?:PublicContentItem}) {
  const [state,action,pending]=useActionState(saveContentItemAction,emptyActionState);
  const [deleteState,deleteAction,deleting]=useActionState(deleteContentItemAction,emptyActionState);
  const [localUrl,setLocalUrl]=useState<string|null>(null);
  const imageId=useId();
  useEffect(()=>()=>{if(localUrl)URL.revokeObjectURL(localUrl);},[localUrl]);
  const draft:PublicContentItem=item??{id:"preview",kind,title:"Preview gambar",body:"",link:"",active:false,sortOrder:0,mediaUrl:null};
  const media=isMediaKind(kind);
  return <article className="grid gap-4 rounded-xl border border-white/10 bg-zinc-900 p-4">
    <ConfirmationForm action={action} confirmation={data => contentConfirmation(item, data)} className="grid gap-4">
      <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={item?.id??""} />
      <Field label={kind==="FAQ"?"Pertanyaan":media?"Deskripsi gambar / nama partner":"Judul"} name="title" value={item?.title} error={state.errors.title?.[0]} />
      {!media ? <Field label={kind==="FAQ"?"Jawaban":"Penjelasan faktual"} name="body" value={item?.body} multiline max={3000} error={state.errors.body?.[0]} />:<input type="hidden" name="body" value="" />}
      {media ? <><Field label="Link opsional — /cars atau https://…" name="link" value={item?.link} max={500} error={state.errors.link?.[0]} /><FormField error={state.errors.image?.[0]} htmlFor={imageId} label="Satu gambar untuk semua perangkat — maksimal 8 MB"><input type="file" name="image" accept="image/jpeg,image/png,image/webp" required={!item} className={input} onChange={event=>{const file=event.target.files?.[0];setLocalUrl(file?URL.createObjectURL(file):null);}} /></FormField><Preview item={draft} url={localUrl ?? item?.mediaUrl??null} /></>:<input type="hidden" name="link" value="" />}
      <Field label="Urutan (angka terkecil lebih dahulu)" name="sortOrder" value={String(item?.sortOrder??0)} error={state.errors.sortOrder?.[0]} type="number" min={0} maxValue={999} />
      <label><input type="checkbox" name="active" defaultChecked={item?.active} /> Aktif</label>
      <button type="submit" disabled={pending} className={button}>{pending?"Menyimpan…":item?"Simpan perubahan":"Tambah item"}</button><Status {...state} />
    </ConfirmationForm>
    {item?<ConfirmationForm action={deleteAction} confirmation={() => criticalAction(`Hapus ${item.title}?`, item.active ? "Konten aktif ini akan hilang dari website publik dan medianya akan dibersihkan." : "Konten dan referensi medianya akan dihapus.", "Hapus konten", true)} className="grid gap-3 border-t border-white/10 pt-3"><input type="hidden" name="id" value={item.id} /><input type="hidden" name="confirm" value="on" /><button type="submit" className="min-h-11 rounded-lg border border-red-400 px-4 text-red-300 focus-visible:outline-2 focus-visible:outline-white" disabled={deleting}>Hapus</button><Status {...deleteState} /></ConfirmationForm>:null}
  </article>;
}
