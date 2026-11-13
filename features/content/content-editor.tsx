"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { DealerContent } from "@prisma/client";
import { ConfirmationForm } from "@/components/admin/confirmation-form";
import { profileConfirmation, contentConfirmation, criticalAction } from "@/features/admin/confirmation-policy";
import { FormField } from "@/components/ui/form-field";
import { useFeedbackAction } from "@/features/forms/use-feedback-action";
import { useCmsFeedback } from "./cms-feedback";
import { createDefaultAdvantagesAction, saveDealerContentAction, saveContentItemAction, deleteContentItemAction } from "@/server/content/actions";
import { BannerCarousel } from "./banner-carousel";
import { ADVANTAGE_ICON_KEYS, ADVANTAGE_SECTION_TOKEN, advantageIconFromToken, advantageIconToken, isMediaKind, type ContentKind, type PublicContentItem } from "./domain";
const input = "w-full min-h-11 rounded-lg border border-white/20 bg-zinc-950 px-3 py-2 text-white focus-visible:outline-2 focus-visible:outline-brand-focus";
const button = "min-h-11 rounded-lg bg-brand-primary px-5 py-2 font-bold text-brand-on-primary disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-brand-focus";
function Status({message,errors}:{message:string;errors:Record<string,string[]|undefined>}) {return <div role="status" className="text-sm text-zinc-200"><p>{message}</p>{Object.entries(errors).map(([field,list])=>list?.length?<p key={field}>{list.join(" ")}</p>:null)}</div>;}
function Field({label,name,value="",multiline=false,max=200,error,type="text",min,maxValue}:{label:string;name:string;value?:string;multiline?:boolean;max?:number;error?:string;type?:"text"|"number";min?:number;maxValue?:number}) {const id=useId();const [draft,setDraft]=useState(value);return <FormField error={error} htmlFor={id} label={label}>{multiline?<textarea className={`${input} min-h-28`} name={name} value={draft} onChange={event=>setDraft(event.target.value)} maxLength={max} />:<input className={input} name={name} value={draft} onChange={event=>setDraft(event.target.value)} maxLength={type==="text"?max:undefined} max={maxValue} min={min} type={type} />}</FormField>;}
export function ProfileEditor({profile,showroomUrl}:{profile:DealerContent|null;showroomUrl?:string|null}) {
  const notify=useCmsFeedback();
  const [state,action,pending]=useFeedbackAction(saveDealerContentAction,notify);
  const showroomId=useId();
  return <ConfirmationForm action={action} confirmation={data => profileConfirmation(profile, data)} className="grid gap-5 rounded-2xl border border-white/10 bg-zinc-900 p-4 sm:p-6">
    <fieldset className="grid gap-4 rounded-xl border border-white/10 p-4"><legend className="px-2 text-lg font-bold">Beranda</legend>
      <p className="text-sm text-zinc-400">Teks sambutan singkat yang tampil bersama banner utama.</p>
      <Field label="Judul sambutan" name="welcomeTitle" value={profile?.welcomeTitle} max={150} error={state.errors.welcomeTitle?.[0]} />
      <Field label="Isi sambutan" name="welcomeBody" value={profile?.welcomeBody} multiline max={2000} error={state.errors.welcomeBody?.[0]} />
      <ToggleLabel><DraftCheckbox name="welcomeActive" initial={profile?.welcomeActive} /> Tampilkan sambutan di beranda</ToggleLabel>
      <Field label="Ringkasan tentang kami di beranda" name="aboutSummary" value={profile?.aboutSummary} multiline max={1500} error={state.errors.aboutSummary?.[0]} />
    </fieldset>
    <fieldset className="grid gap-4 rounded-xl border border-white/10 p-4"><legend className="px-2 text-lg font-bold">Cerita Dealer</legend>
      {([ ["history","Sejarah perusahaan"], ["vision","Visi"], ["mission","Misi"], ["achievements","Pencapaian faktual — kosongkan jika belum ada"] ] as const).map(([name,label])=><Field key={name} label={label} name={name} value={profile?.[name] ?? ""} multiline max={name==="history"?12000:name==="achievements"?6000:4000} error={state.errors[name]?.[0]} />)}
      <Field label="Cerita lengkap dealer di halaman Tentang Kami" name="aboutStory" value={profile?.aboutStory} multiline max={12000} error={state.errors.aboutStory?.[0]} />
      <ToggleLabel><DraftCheckbox name="aboutActive" initial={profile?.aboutActive} /> Tampilkan bagian Tentang Kami</ToggleLabel>
    </fieldset>
    <fieldset className="grid gap-4 rounded-xl border border-white/10 p-4"><legend className="px-2 text-lg font-bold">Showroom & Operasional</legend>
      {showroomUrl ? <div className="relative aspect-video max-w-xl overflow-hidden rounded-xl border border-white/10"><Image alt={profile?.showroomAlt || "Foto showroom saat ini"} className="object-cover" fill sizes="(max-width: 640px) 100vw, 576px" src={showroomUrl} unoptimized /></div> : null}
      <FormField error={state.errors.image?.[0]} htmlFor={showroomId} label="Foto showroom — JPEG/PNG/WEBP, maksimal 8 MB"><input type="file" name="image" accept="image/jpeg,image/png,image/webp" className={input} /></FormField>
      <Field label="Deskripsi foto showroom" name="showroomAlt" value={profile?.showroomAlt} error={state.errors.showroomAlt?.[0]} />
      {profile?.showroomKey ? <ToggleLabel><input type="checkbox" name="removeImage" /> Hapus foto showroom (upload baru menggantikan foto lama)</ToggleLabel>:null}
      <Field label="Jam operasional (faktual, kosong bila belum tersedia)" name="operatingHours" value={profile?.operatingHours} multiline max={1500} error={state.errors.operatingHours?.[0]} />
      <ToggleLabel><DraftCheckbox name="operatingHoursActive" initial={profile?.operatingHoursActive} /> Tampilkan jam operasional</ToggleLabel>
    </fieldset>
    <button type="submit" className={button} disabled={pending}>{pending?"Menyimpan…":"Simpan profil dealer"}</button>
    <Status {...state} />
  </ConfirmationForm>;
}
function Preview({item,url}:{item:PublicContentItem;url:string|null}) {
  const [width,setWidth]=useState(390);
  return <div className="grid gap-2"><label className="grid gap-2">Preview perangkat<select className={input} value={width} onChange={e=>setWidth(Number(e.target.value))}><option value={390}>HP — 390px</option><option value={768}>Tablet — 768px</option><option value={1280}>Desktop — 1280px</option></select></label><div className="mx-auto w-full" style={{maxWidth:width}}><BannerCarousel slides={url?[{...item,mediaUrl:url}]:[]} previewWidth={width} label="Preview banner" /></div></div>;
}
export function ItemEditor({kind,item,cancelHref,sectionHeading=false}:{kind:ContentKind;item?:PublicContentItem;cancelHref:string;sectionHeading?:boolean}) {
  const notify=useCmsFeedback();
  const router=useRouter();
  const [dirty,setDirty]=useState(false);
  const [state,action,pending]=useFeedbackAction(async(previous,data)=>{const result=await saveContentItemAction(previous,data);if(result.status==="success"||result.status==="warning")setDirty(false);return result;},notify);
  const [localUrl,setLocalUrl]=useState<string|null>(null);
  const imageId=useId();
  useEffect(()=>()=>{if(localUrl)URL.revokeObjectURL(localUrl);},[localUrl]);
  useEffect(()=>{if(!dirty)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();};window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);},[dirty]);
  const draft:PublicContentItem=item??{id:"preview",kind,title:"Preview gambar",body:"",link:"",active:false,sortOrder:0,mediaUrl:null};
  const media=isMediaKind(kind);
  return <article className="grid gap-4 rounded-xl border border-white/10 bg-zinc-900 p-4">
    <header><p className="text-xs font-bold uppercase tracking-wider text-red-400">{item?"Edit konten":"Konten baru"}</p><h3 className="mt-1 text-xl font-bold">{item?.title ?? "Lengkapi detail konten"}</h3></header>
    <ConfirmationForm action={action} confirmation={data => contentConfirmation(item, data)} className="grid gap-4" onChangeCapture={()=>setDirty(true)}>
      <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={item?.id??""} />
      <Field label={sectionHeading?"Judul bagian":kind==="TESTIMONIAL"?"Attribution — nama tampilan yang diizinkan":kind==="FAQ"?"Pertanyaan":media?"Deskripsi gambar / nama partner":"Judul"} name="title" value={item?.title??(sectionHeading?"Mengapa Memilih Kami?":undefined)} error={state.errors.title?.[0]} />
      {sectionHeading?<input type="hidden" name="body" value=""/>:!media ? <Field label={kind==="TESTIMONIAL"?"Kutipan testimoni asli (tanpa rating buatan)":kind==="FAQ"?"Jawaban":"Penjelasan faktual"} name="body" value={item?.body} multiline max={3000} error={state.errors.body?.[0]} />:<input type="hidden" name="body" value="" />}
      {sectionHeading?<input type="hidden" name="link" value={ADVANTAGE_SECTION_TOKEN}/>:media ? <><Field label="Link opsional — /cars atau https://…" name="link" value={item?.link} max={500} error={state.errors.link?.[0]} /><FormField error={state.errors.image?.[0]} htmlFor={imageId} label="Satu gambar untuk semua perangkat — maksimal 8 MB"><input type="file" name="image" accept="image/jpeg,image/png,image/webp" required={!item} className={input} onChange={event=>{const file=event.target.files?.[0];setLocalUrl(file?URL.createObjectURL(file):null);}} /></FormField><Preview item={draft} url={localUrl ?? item?.mediaUrl??null} /></>:kind==="ADVANTAGE"?<><AdvantageIconSelect value={item?.link??""} error={state.errors.link?.[0]}/><FormField error={state.errors.image?.[0]} htmlFor={imageId} label="Ikon khusus opsional — JPEG/PNG/WebP, maksimal 8 MB"><input type="file" name="image" accept="image/jpeg,image/png,image/webp" className={input} onChange={event=>{const file=event.target.files?.[0];setLocalUrl(file?URL.createObjectURL(file):null);}} /></FormField>{localUrl ?? item?.mediaUrl ? <Image alt="Preview ikon keunggulan" className="h-20 w-20 rounded-xl border border-white/10 bg-white object-contain p-2" height={80} src={(localUrl ?? item?.mediaUrl)!} unoptimized width={80} />:null}{item?.mediaUrl?<ToggleLabel><input type="checkbox" name="removeImage"/> Hapus ikon khusus dan gunakan ikon pilihan</ToggleLabel>:null}</>:<input type="hidden" name="link" value="" />}
      {sectionHeading?<input type="hidden" name="sortOrder" value="0"/>:<Field label="Urutan (angka terkecil lebih dahulu)" name="sortOrder" value={String(item?.sortOrder??0)} error={state.errors.sortOrder?.[0]} type="number" min={0} maxValue={999} />}
      <ToggleLabel><DraftCheckbox name="active" initial={item?.active??sectionHeading} /> {sectionHeading?"Tampilkan bagian Mengapa Memilih di website":"Aktif dan tampil di website"}</ToggleLabel>
      <div className="flex flex-wrap gap-3"><button type="submit" disabled={pending} className={button}>{pending?"Menyimpan…":item?"Simpan perubahan":"Tambah item"}</button><CancelEditorButton dirty={dirty} leave={()=>router.push(cancelHref)} /></div><Status {...state} />
    </ConfirmationForm>
  </article>;
}

function AdvantageIconSelect({value,error}:{value:string;error?:string}) {
  const id=useId();
  const labels:Record<(typeof ADVANTAGE_ICON_KEYS)[number],string>={quality:"Kualitas",transparent:"Transparansi",professional:"Profesional",easy:"Proses mudah",consultation:"Konsultasi",satisfaction:"Kepuasan"};
  const selected=advantageIconFromToken(value);
  return <FormField error={error} htmlFor={id} label="Ikon manfaat"><select className={input} defaultValue={selected?advantageIconToken(selected):""} id={id} name="link"><option value="">Otomatis berdasarkan urutan</option>{ADVANTAGE_ICON_KEYS.map(icon=><option key={icon} value={advantageIconToken(icon)}>{labels[icon]}</option>)}</select></FormField>;
}

export function DefaultAdvantagesForm() {
  const notify=useCmsFeedback();
  const [state,action,pending]=useFeedbackAction(createDefaultAdvantagesAction,notify);
  return <ConfirmationForm action={action} confirmation={()=>criticalAction("Gunakan enam konten default?","Template akan membuat enam kartu aktif yang dapat langsung diedit, diurutkan, atau dinonaktifkan.","Gunakan template")} className="grid gap-2"><button className={button} disabled={pending} type="submit">{pending?"Menambahkan…":"Gunakan 6 konten default"}</button><Status {...state}/></ConfirmationForm>;
}

export function DeleteItemForm({item}:{item:PublicContentItem}) {
  const notify=useCmsFeedback();
  const [state,action,pending]=useFeedbackAction(deleteContentItemAction,notify);
  return <ConfirmationForm action={action} confirmation={() => criticalAction(`Hapus ${item.title}?`, item.active ? "Konten aktif ini akan hilang dari website publik dan medianya akan dibersihkan." : "Konten dan referensi medianya akan dihapus.", "Hapus konten", true)} className="grid gap-2"><input type="hidden" name="id" value={item.id} /><input type="hidden" name="confirm" value="on" /><button type="submit" className="min-h-11 rounded-xl border border-red-400/70 px-4 font-semibold text-red-300 hover:bg-red-500/10 focus-visible:outline-2 focus-visible:outline-white" disabled={pending}>{pending?"Menghapus…":"Hapus"}</button><Status {...state} /></ConfirmationForm>;
}

function ToggleLabel({children}:{children:ReactNode}) {return <label className="flex min-h-11 items-center gap-3 rounded-lg border border-white/10 px-3 text-sm text-zinc-200">{children}</label>;}

function CancelEditorButton({dirty,leave}:{dirty:boolean;leave:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const titleId=useId();
  return <><button type="button" className="min-h-11 rounded-lg border border-white/20 px-5 font-semibold text-white focus-visible:outline-2 focus-visible:outline-brand-focus" onClick={()=>dirty?dialog.current?.showModal():leave()}>Batal</button><dialog ref={dialog} aria-labelledby={titleId} className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-md rounded-2xl border border-white/20 bg-zinc-950 p-6 text-zinc-100 shadow-2xl backdrop:bg-black/70" onCancel={event=>{event.preventDefault();dialog.current?.close();}}><h3 className="text-xl font-bold" id={titleId}>Batalkan perubahan?</h3><p className="mt-3 text-sm leading-6 text-zinc-300">Perubahan yang belum disimpan akan hilang.</p><div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" className="min-h-11 rounded-lg border border-white/20 px-4" onClick={()=>dialog.current?.close()}>Lanjut mengedit</button><button type="button" className="min-h-11 rounded-lg bg-red-600 px-4 font-bold text-white" onClick={leave}>Buang perubahan</button></div></dialog></>;
}

function DraftCheckbox({name,initial=false}:{name:string;initial?:boolean}) {const [checked,setChecked]=useState(initial);return <input type="checkbox" name={name} checked={checked} onChange={event=>setChecked(event.target.checked)} />;}
