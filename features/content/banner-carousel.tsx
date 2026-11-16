"use client";
import { shouldBypassImageOptimization } from "@/lib/image-delivery";
import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AUTOPLAY_MS, bannerFit, bannerRatio, type PublicContentItem } from "./domain";

function BannerImage({slide, eager, mobileContain=false, forceContain=false, onNaturalRatio}: {slide: PublicContentItem; eager:boolean; mobileContain?:boolean; forceContain?:boolean; onNaturalRatio?:(ratio:number)=>void}) {
  const [fit,setFit] = useState<"cover"|"contain">("cover");
  const [failed,setFailed] = useState(false);
  if (!slide.mediaUrl || failed) return <div className="h-full bg-zinc-900" role="img" aria-label="Gambar banner tidak tersedia" />;
  const remote = shouldBypassImageOptimization(slide.mediaUrl);
  return <>
    {fit === "contain" || mobileContain || forceContain ? <Image alt="" aria-hidden="true" src={slide.mediaUrl} fill sizes="100vw" unoptimized={remote} className={`${mobileContain ? "hidden sm:block" : ""} scale-110 object-cover blur-xl brightness-50`} /> : null}
    <Image alt={slide.title} src={slide.mediaUrl} fill sizes="100vw" priority={eager} unoptimized={remote} className={forceContain || fit === "contain" || mobileContain ? "object-contain" : "object-cover"} onLoad={event=>{const {naturalWidth,naturalHeight}=event.currentTarget;setFit(bannerFit(naturalWidth,naturalHeight));if(naturalWidth>0&&naturalHeight>0)onNaturalRatio?.(naturalWidth/naturalHeight);}} onError={()=>setFailed(true)} />
  </>;
}
type WelcomeTypography = { headingDesktopPx?:number|null; headingMobilePx?:number|null; bodyDesktopPx?:number|null; bodyMobilePx?:number|null };
export function BannerCarousel({slides, label="Banner utama", previewWidth, priority=false, headline, description, welcomeTypography, compact=false, portrait=false, linkSlides=false}: {slides:PublicContentItem[];label?:string;previewWidth?:number;priority?:boolean;headline?:string;description?:string;welcomeTypography?:WelcomeTypography;compact?:boolean;portrait?:boolean;linkSlides?:boolean}) {
  const [index,setIndex] = useState(0);
  const [paused,setPaused] = useState(false);
  const [stopped,setStopped] = useState(false);
  const [hidden,setHidden] = useState(false);
  const [reduced,setReduced] = useState(false);
  const [mobileRatio,setMobileRatio] = useState(21/9);
  const start = useRef<{x:number;y:number}|null>(null);
  const swiped = useRef(false);
  const count = slides.length;
  const current = count ? index % count : 0;
  function go(value:number) {if(count){setIndex((value + count) % count);setStopped(true);}}
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
  const sectionStyle = previewWidth ? {aspectRatio:bannerRatio(previewWidth),height:"auto"} : !portrait && !compact ? {"--mobile-banner-ratio":String(mobileRatio)} as CSSProperties : undefined;
  return <><section aria-label={label} aria-roledescription="carousel" tabIndex={count>1?0:undefined} className={`relative w-full overflow-hidden bg-[#111111] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white ${portrait ? "aspect-[4/5] lg:aspect-[3/4]" : compact ? "aspect-[2/1] xl:aspect-[21/9]" : "aspect-[var(--mobile-banner-ratio)] h-auto sm:aspect-auto sm:h-[clamp(20rem,42vw,26.25rem)] lg:h-[clamp(26.25rem,41vw,32.5rem)]"}`} style={sectionStyle}
    onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setPaused(false);}}
    onKeyDown={event=>{if(event.key==="ArrowLeft" || event.key==="ArrowRight"){event.preventDefault();go(current+(event.key==="ArrowRight"?1:-1));}}}
    onTouchStart={event=>{start.current={x:event.touches[0].clientX,y:event.touches[0].clientY};swiped.current=false;}}
    onTouchEnd={event=>{if(start.current){const dx=event.changedTouches[0].clientX-start.current.x;const dy=event.changedTouches[0].clientY-start.current.y;if(Math.abs(dx)>40 && Math.abs(dx)>Math.abs(dy)){swiped.current=true;go(current+(dx<0?1:-1));}start.current=null;}}}
    onClickCapture={event=>{if(swiped.current){event.preventDefault();swiped.current=false;}}}>
    <div className="flex h-full transition-transform duration-500 motion-reduce:transition-none" style={{transform:`translateX(-${current*100}%)`}}>
      {slides.map((slide,i)=><div key={slide.id} className="relative h-full w-full shrink-0" role="group" aria-roledescription="slide" aria-label={`${i+1} dari ${count}`} aria-hidden={i!==current} inert={i!==current}>
        {linkSlides && slide.link ? <a aria-label={`Buka ${slide.title}`} className="block h-full focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white" href={slide.link} {...(slide.link.startsWith("https:")?{target:"_blank",rel:"noopener noreferrer"}:{})}><BannerImage slide={slide} eager={priority && i===0} forceContain={portrait} /></a> : <BannerImage slide={slide} eager={priority && i===0} mobileContain={!compact} forceContain={portrait} onNaturalRatio={i===0?setMobileRatio:undefined} />}
      </div>)}
    </div>
    {headline ? <div className="pointer-events-none absolute inset-0 hidden items-center bg-gradient-to-r from-black/75 via-black/30 to-transparent px-[7vw] py-16 text-left text-white sm:flex"><div className="w-full max-w-7xl"><h2 className="max-w-3xl break-words text-4xl font-bold tracking-tight lg:text-5xl xl:text-6xl" style={{fontSize:welcomeTypography?.headingDesktopPx??undefined}}>{headline}</h2>{description ? <p className="mt-4 max-w-2xl break-words text-base leading-7 text-white/90" style={{fontSize:welcomeTypography?.bodyDesktopPx??undefined}}>{description}</p> : null}</div></div> : null}
    {count>1 ? <>
      <button type="button" aria-label="Banner sebelumnya" onClick={()=>go(current-1)} className="absolute left-3 top-1/2 min-h-11 min-w-11 -translate-y-1/2 rounded-sm border border-white/40 bg-black/55 text-2xl text-white backdrop-blur focus-visible:outline-2 focus-visible:outline-white sm:left-6">‹</button>
      <button type="button" aria-label="Banner berikutnya" onClick={()=>go(current+1)} className="absolute right-3 top-1/2 min-h-11 min-w-11 -translate-y-1/2 rounded-sm border border-white/40 bg-black/55 text-2xl text-white backdrop-blur focus-visible:outline-2 focus-visible:outline-white sm:right-6">›</button>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center rounded-sm bg-black/60 px-1 backdrop-blur">
        {slides.map((slide,i)=><button type="button" key={slide.id} aria-label={`Tampilkan banner ${i+1}`} aria-current={i===current?"true":undefined} onClick={()=>go(i)} className="grid min-h-11 min-w-11 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-white"><span className={`h-2 rounded-full ${i===current?"w-5 bg-white":"w-2 bg-white/50"}`} /></button>)}
        <button type="button" aria-label={stopped?"Jalankan pergantian otomatis":"Jeda pergantian otomatis"} aria-pressed={stopped} onClick={()=>setStopped(value=>!value)} className="min-h-11 min-w-11 rounded-full text-white focus-visible:outline-2 focus-visible:outline-white">{stopped?"▶":"Ⅱ"}</button>
      </div>
    </> : null}
  </section>{headline && !compact && !portrait ? <div className="bg-white px-5 py-6 text-[#171717] sm:hidden"><h2 className="break-words text-3xl font-bold tracking-tight" style={{fontSize:welcomeTypography?.headingMobilePx??undefined}}>{headline}</h2>{description ? <p className="mt-3 break-words leading-7 text-[#606060]" style={{fontSize:welcomeTypography?.bodyMobilePx??undefined}}>{description}</p> : null}</div> : null}</>;
}
