"use client";
import { shouldBypassImageOptimization } from "@/lib/image-delivery";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AUTOPLAY_MS, bannerFit, bannerRatio, type PublicContentItem } from "./domain";

function BannerImage({slide, eager}: {slide: PublicContentItem; eager:boolean}) {
  const [fit,setFit] = useState<"cover"|"contain">("cover");
  const [failed,setFailed] = useState(false);
  if (!slide.mediaUrl || failed) return <div className="h-full bg-zinc-900" role="img" aria-label="Gambar banner tidak tersedia" />;
  const remote = shouldBypassImageOptimization(slide.mediaUrl);
  return <>
    {fit === "contain" ? <Image alt="" aria-hidden="true" src={slide.mediaUrl} fill sizes="100vw" unoptimized={remote} className="scale-110 object-cover blur-xl brightness-50" /> : null}
    <Image alt={slide.title} src={slide.mediaUrl} fill sizes="100vw" priority={eager} unoptimized={remote} className={fit === "contain" ? "object-contain" : "object-cover"} onLoad={event=>setFit(bannerFit(event.currentTarget.naturalWidth,event.currentTarget.naturalHeight))} onError={()=>setFailed(true)} />
  </>;
}
export function BannerCarousel({slides, label="Banner utama", previewWidth, priority=false}: {slides:PublicContentItem[];label?:string;previewWidth?:number;priority?:boolean}) {
  const [index,setIndex] = useState(0);
  const [paused,setPaused] = useState(false);
  const [stopped,setStopped] = useState(false);
  const [hidden,setHidden] = useState(false);
  const [reduced,setReduced] = useState(false);
  const start = useRef<{x:number;y:number}|null>(null);
  const swiped = useRef(false);
  const count = slides.length;
  const current = count ? index % count : 0;
  function go(value:number) {if(count) setIndex((value + count) % count);}
  useEffect(()=>{
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = ()=>setReduced(media.matches);
    const updateVisibility = ()=>setHidden(document.hidden);
    updateMotion(); updateVisibility();
    media.addEventListener("change",updateMotion); document.addEventListener("visibilitychange",updateVisibility);
    return ()=>{media.removeEventListener("change",updateMotion);document.removeEventListener("visibilitychange",updateVisibility);};
  },[]);
  useEffect(()=>{
    if(count < 2 || paused || stopped || hidden || reduced) return;
    const timer = window.setInterval(()=>setIndex(value=>(value+1)%count),AUTOPLAY_MS);
    return ()=>window.clearInterval(timer);
  },[count,paused,stopped,hidden,reduced]);
  if(!count) return null;
  return <section aria-label={label} aria-roledescription="carousel" tabIndex={count>1?0:undefined} className="relative w-full overflow-hidden bg-zinc-900 aspect-[2/1] xl:aspect-[21/9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" style={previewWidth ? {aspectRatio:bannerRatio(previewWidth)} : undefined}
    onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setPaused(false);}}
    onKeyDown={event=>{if(event.key==="ArrowLeft" || event.key==="ArrowRight"){event.preventDefault();go(current+(event.key==="ArrowRight"?1:-1));}}}
    onTouchStart={event=>{start.current={x:event.touches[0].clientX,y:event.touches[0].clientY};swiped.current=false;}}
    onTouchEnd={event=>{if(start.current){const dx=event.changedTouches[0].clientX-start.current.x;const dy=event.changedTouches[0].clientY-start.current.y;if(Math.abs(dx)>40 && Math.abs(dx)>Math.abs(dy)){swiped.current=true;go(current+(dx<0?1:-1));}start.current=null;}}}
    onClickCapture={event=>{if(swiped.current){event.preventDefault();swiped.current=false;}}}>
    <div className="flex h-full transition-transform duration-500 motion-reduce:transition-none" style={{transform:`translateX(-${current*100}%)`}}>
      {slides.map((slide,i)=><div key={slide.id} className="relative h-full w-full shrink-0" role="group" aria-roledescription="slide" aria-label={`${i+1} dari ${count}`} aria-hidden={i!==current} inert={i!==current}>
        {slide.link ? <Link href={slide.link} aria-label={slide.title} className="relative block h-full focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white" {...(slide.link.startsWith("https:")?{target:"_blank",rel:"noopener noreferrer"}:{})}><BannerImage slide={slide} eager={priority && i===0} /></Link> : <BannerImage slide={slide} eager={priority && i===0} />}
      </div>)}
    </div>
    {count>1 ? <>
      <button type="button" aria-label="Banner sebelumnya" onClick={()=>go(current-1)} className="absolute left-2 top-1/2 min-h-11 min-w-11 -translate-y-1/2 rounded-full bg-black/60 text-2xl text-white focus-visible:outline-2 focus-visible:outline-white">‹</button>
      <button type="button" aria-label="Banner berikutnya" onClick={()=>go(current+1)} className="absolute right-2 top-1/2 min-h-11 min-w-11 -translate-y-1/2 rounded-full bg-black/60 text-2xl text-white focus-visible:outline-2 focus-visible:outline-white">›</button>
      <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center rounded-full bg-black/60 px-1">
        {slides.map((slide,i)=><button type="button" key={slide.id} aria-label={`Tampilkan banner ${i+1}`} aria-current={i===current?"true":undefined} onClick={()=>go(i)} className="grid min-h-11 min-w-11 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-white"><span className={`h-2 rounded-full ${i===current?"w-5 bg-white":"w-2 bg-white/50"}`} /></button>)}
        <button type="button" aria-label={stopped?"Jalankan pergantian otomatis":"Jeda pergantian otomatis"} aria-pressed={stopped} onClick={()=>setStopped(value=>!value)} className="min-h-11 min-w-11 rounded-full text-white focus-visible:outline-2 focus-visible:outline-white">{stopped?"▶":"Ⅱ"}</button>
      </div>
    </> : null}
  </section>;
}
