"use client";

import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";

type Props = {
  children: ReactNode;
  delay?: 1 | 2 | 3;
  as?: "div" | "section" | "article" | "li";
  className?: string;
  style?: CSSProperties;
};

/** Fades and lifts an element in once it enters the viewport. Visible without JS. */
export default function Reveal({ children, delay, as = "div", className = "", style }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      el?.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as "div";
  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`reveal${delay ? ` d${delay}` : ""} ${className}`.trim()}
      style={style}
    >
      {children}
    </Tag>
  );
}
