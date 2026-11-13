"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

type Testimonial = {
  id: string;
  title: string;
  body: string;
};

export function testimonialInitial(name: string) {
  return name.trim().charAt(0).toLocaleUpperCase("id-ID") || "?";
}

export function testimonialVisibleCount(viewportWidth: number) {
  if (viewportWidth >= 1024) return 3;
  if (viewportWidth >= 640) return 2;
  return 1;
}

export function testimonialMaxIndex(itemCount: number, visibleCount: number) {
  return Math.max(0, itemCount - Math.max(1, visibleCount));
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={direction === "left" ? "m15 18-6-6 6-6" : "m9 6 6 6-6 6"} /></svg>;
}

export function TestimonialCarousel({ items }: { items: Testimonial[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(1);
  const maxIndex = testimonialMaxIndex(items.length, visibleCount);

  const goTo = useCallback((requestedIndex: number) => {
    const track = trackRef.current;
    const firstCard = track?.querySelector<HTMLElement>("[data-testimonial-card]");
    if (!track || !firstCard) return;
    const nextIndex = Math.min(maxIndex, Math.max(0, requestedIndex));
    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: nextIndex * (firstCard.offsetWidth + gap), behavior: reducedMotion ? "auto" : "smooth" });
    setCurrentIndex(nextIndex);
  }, [maxIndex]);

  useEffect(() => {
    const updateVisibleCount = () => setVisibleCount(testimonialVisibleCount(window.innerWidth));
    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  useEffect(() => {
    if (currentIndex > maxIndex) goTo(maxIndex);
  }, [currentIndex, goTo, maxIndex]);

  function updateIndexFromScroll() {
    const track = trackRef.current;
    const firstCard = track?.querySelector<HTMLElement>("[data-testimonial-card]");
    if (!track || !firstCard) return;
    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
    const step = firstCard.offsetWidth + gap;
    if (step > 0) setCurrentIndex(Math.min(maxIndex, Math.max(0, Math.round(track.scrollLeft / step))));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    goTo(currentIndex + (event.key === "ArrowRight" ? 1 : -1));
  }

  return <div aria-label="Testimoni pelanggan" aria-roledescription="carousel" className="min-w-0" onKeyDown={handleKeyDown} role="region" tabIndex={0}>
    <div className="flex items-center justify-between gap-4">
      <p aria-live="polite" className="text-sm text-[#606060]">Menampilkan {currentIndex + 1}–{Math.min(items.length, currentIndex + visibleCount)} dari {items.length} testimoni</p>
      <div className="flex shrink-0 gap-2">
        <button aria-label="Testimoni sebelumnya" className="grid h-11 w-11 place-items-center rounded-full border border-[#D5D5D5] bg-white text-[#171717] transition hover:border-[#C8102E] hover:text-[#C8102E] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-brand-focus" disabled={currentIndex === 0} onClick={() => goTo(currentIndex - 1)} type="button"><ArrowIcon direction="left" /></button>
        <button aria-label="Testimoni berikutnya" className="grid h-11 w-11 place-items-center rounded-full border border-[#D5D5D5] bg-white text-[#171717] transition hover:border-[#C8102E] hover:text-[#C8102E] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-brand-focus" disabled={currentIndex === maxIndex} onClick={() => goTo(currentIndex + 1)} type="button"><ArrowIcon direction="right" /></button>
      </div>
    </div>
    <div className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden" onScroll={updateIndexFromScroll} ref={trackRef}>
      {items.map((item, index) => <div aria-label={`${index + 1} dari ${items.length}`} aria-roledescription="slide" className="min-w-0 basis-full shrink-0 snap-start sm:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-2rem)/3)]" data-testimonial-card key={item.id} role="group">
        <figure className="group flex h-full min-h-72 flex-col rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#C8102E]/35 hover:shadow-lg">
          <div aria-hidden="true" className="text-4xl font-black leading-none text-[#C8102E]/25">“</div>
          <blockquote className="mt-2 flex-1 whitespace-pre-line leading-7 text-[#303030]">{item.body}</blockquote>
          <figcaption className="mt-6 flex items-center gap-3 border-t border-[#EEEEEE] pt-5">
            <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#171717] text-sm font-black text-white">{testimonialInitial(item.title)}</span>
            <span className="min-w-0"><span className="block break-words font-bold text-[#171717]">{item.title}</span><span className="mt-0.5 block text-xs text-[#777777]">Testimoni pelanggan</span></span>
          </figcaption>
        </figure>
      </div>)}
    </div>
    <div aria-label="Pilih halaman testimoni" className="mt-5 flex flex-wrap justify-center gap-2" role="group">
      {Array.from({ length: maxIndex + 1 }, (_, index) => <button aria-current={currentIndex === index ? "true" : undefined} aria-label={`Tampilkan testimoni ${index + 1}`} className={`h-2.5 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus ${currentIndex === index ? "w-8 bg-[#C8102E]" : "w-2.5 bg-[#C8C8C8] hover:bg-[#777777]"}`} key={index} onClick={() => goTo(index)} type="button" />)}
    </div>
  </div>;
}
