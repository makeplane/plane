/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";

export type THeading = { text: string; level: number; index: number };

export type THelpArticleHeadings = {
  headings: THeading[];
  active: number;
  scrollTo: (index: number) => void;
};

const HEADING_SELECTOR = "h1, h2, h3";

// Derives the in-article heading list, the active-section highlight, and the
// scroll targets from the live rendered DOM (one index space) so they stay
// aligned regardless of how the editor renders/normalizes headings. A single
// observer feeds BOTH the desktop sidebar and the mobile disclosure (no
// duplicate IntersectionObservers).
export const useHelpArticleHeadings = (
  contentRef: React.RefObject<HTMLDivElement | null>,
  html: string
): THelpArticleHeadings => {
  const [headings, setHeadings] = useState<THeading[]>([]);
  const [active, setActive] = useState(0);
  const intersectionRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const build = () => {
      const nodes = Array.from(container.querySelectorAll<HTMLElement>(HEADING_SELECTOR));
      if (nodes.length === 0) {
        // New article hasn't rendered headings (or has none) — clear stale TOC.
        setHeadings([]);
        return false;
      }
      // index = position in the live node list, so scroll/highlight map directly.
      const list = nodes
        .map((node, index) => ({ text: (node.textContent ?? "").trim(), level: Number(node.tagName[1]) || 1, index }))
        .filter((heading) => heading.text.length > 0);
      setHeadings(list);
      setActive(0);
      intersectionRef.current?.disconnect();
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .map((entry) => Number((entry.target as HTMLElement).dataset.tocIndex));
          if (visible.length) setActive(Math.min(...visible));
        },
        { rootMargin: "0px 0px -70% 0px", threshold: 0 }
      );
      list.forEach((heading) => {
        const node = nodes[heading.index];
        node.dataset.tocIndex = String(heading.index);
        observer.observe(node);
      });
      intersectionRef.current = observer;
      return true;
    };

    let mutationObserver: MutationObserver | undefined;
    if (!build()) {
      // Editor content hydrates asynchronously — build once the headings mount.
      mutationObserver = new MutationObserver(() => {
        if (build()) mutationObserver?.disconnect();
      });
      mutationObserver.observe(container, { childList: true, subtree: true });
    }

    return () => {
      mutationObserver?.disconnect();
      intersectionRef.current?.disconnect();
      intersectionRef.current = null;
    };
  }, [html, contentRef]);

  const scrollTo = (index: number) => {
    const nodes = contentRef.current?.querySelectorAll<HTMLElement>(HEADING_SELECTOR);
    nodes?.[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(index);
  };

  return { headings, active, scrollTo };
};
