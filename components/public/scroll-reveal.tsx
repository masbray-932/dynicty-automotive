"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export function ScrollReveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    element.classList.add("scroll-reveal-ready");
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      element.classList.add("scroll-reveal-visible");
      observer.unobserve(element);
    }, { rootMargin: "0px 0px -8%", threshold: 0.12 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div className={className} ref={ref} style={{ "--reveal-delay": `${Math.min(Math.max(delay, 0), 240)}ms` } as CSSProperties}>{children}</div>;
}
