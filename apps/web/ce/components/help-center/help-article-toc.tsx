/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";

type THeading = { text: string; level: number; index: number };

const HEADING_SELECTOR = "h1, h2, h3";

type Props = { html: string; contentRef: React.RefObject<HTMLDivElement | null> };

// In-article table of contents. The list, scroll targets, and active-highlight
// are ALL derived from the live rendered DOM (one index space), so they stay
// aligned regardless of how the editor renders/normalizes headings. Only shown
// when the article has >=2 non-empty headings.
export const HelpArticleToc = ({ html, contentRef }: Props) => {
  const { t } = useTranslation();
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

  if (headings.length < 2) return null;

  const scrollTo = (index: number) => {
    const nodes = contentRef.current?.querySelectorAll<HTMLElement>(HEADING_SELECTOR);
    nodes?.[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(index);
  };

  return (
    <nav aria-label={t("help_center.on_this_page")} className="sticky top-4">
      <p className="mb-2 text-13 font-semibold text-secondary">{t("help_center.on_this_page")}</p>
      <ul className="space-y-1 border-l border-subtle">
        {headings.map((heading) => (
          <li key={heading.index}>
            <button
              type="button"
              onClick={() => scrollTo(heading.index)}
              aria-current={active === heading.index ? "location" : undefined}
              className={cn(
                "block w-full truncate border-l-2 py-0.5 text-left text-13 transition-colors hover:text-primary",
                heading.level === 3 ? "pl-6" : heading.level === 2 ? "pl-4" : "pl-3",
                active === heading.index
                  ? "border-accent-strong text-accent-primary"
                  : "border-transparent text-tertiary"
              )}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};
