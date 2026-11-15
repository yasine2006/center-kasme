"use client";

import { useEffect, useRef, useState } from "react";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "left" | "right" | "scale";
  delay?: number;
}

export function Reveal({ children, className = "", direction = "up", delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  const cls =
    direction === "left" ? "reveal-left" :
    direction === "right" ? "reveal-right" :
    direction === "scale" ? "animate-scale-in" : "reveal";

  return (
    <div ref={ref} className={`${cls} ${visible ? "visible" : ""} ${className}`}>
      {children}
    </div>
  );
}
