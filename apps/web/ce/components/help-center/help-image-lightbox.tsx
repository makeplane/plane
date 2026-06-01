/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ImageFullScreenModal } from "@plane/editor";
import { useTranslation } from "@plane/i18n";

type ZoomedImage = { src: string; width: string; aspectRatio: number };

const HELP_IMAGE_SELECTOR = "img.read-only-image";

// width is the image's natural width: the viewer fits it to the viewport from the
// true pixel size (intentionally the full size, not the resized in-article width).
const computeZoom = (img: HTMLImageElement): ZoomedImage | null => {
  if (img.closest("a")) return null; // a linked image should still navigate
  const width = img.naturalWidth || img.clientWidth;
  const height = img.naturalHeight || img.clientHeight;
  if (!width) return null; // not loaded yet
  return { src: img.currentSrc || img.src, width: `${width}px`, aspectRatio: height ? width / height : 1 };
};

// Wraps the read-only article content and turns every rendered image into a
// click/keyboard target that opens the platform's full-screen image viewer
// (zoom / pan / download). The read-only editor renders content images with the
// `read-only-image` class but only exposes full-screen via a hover toolbar — this
// adds the expected "click (or Enter/Space) to enlarge" affordance for help
// readers. Scoped to the help reader only (no change to shared editor behaviour).
export function HelpImageLightbox({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomed, setZoomed] = useState<ZoomedImage | null>(null);
  const { t } = useTranslation();
  // Latest t held in a ref so the observer/listener effect can stay mount-once
  // (no teardown/rebuild on locale change); labels refresh via the effect below.
  const tRef = useRef(t);

  const isTouchDevice = useMemo(
    () => typeof window !== "undefined" && ("ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0),
    []
  );

  // Wire delegated click/keyboard + a MutationObserver once. Linked images are
  // left alone (they navigate); only zoomable images become button-like targets.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const enhance = () => {
      container.querySelectorAll<HTMLImageElement>(HELP_IMAGE_SELECTOR).forEach((img) => {
        if (img.closest("a")) return; // a linked image navigates — not a zoom target
        img.setAttribute("aria-label", tRef.current("help_center.view_image_full_screen"));
        if (img.dataset.helpZoomable === "true") return;
        img.dataset.helpZoomable = "true";
        img.setAttribute("role", "button");
        img.setAttribute("tabindex", "0");
      });
    };
    enhance();
    // re-enhance images added after async editor hydration / article change
    const observer = new MutationObserver(() => enhance());
    observer.observe(container, { childList: true, subtree: true });

    const open = (target: EventTarget | null) => {
      const img = (target as HTMLElement | null)?.closest(HELP_IMAGE_SELECTOR) as HTMLImageElement | null;
      if (!img || !container.contains(img)) return null;
      return computeZoom(img);
    };

    const handleClick = (event: MouseEvent) => {
      const next = open(event.target);
      if (!next) return;
      event.preventDefault();
      event.stopPropagation();
      setZoomed(next);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const next = open(event.target);
      if (!next) return;
      event.preventDefault();
      setZoomed(next);
    };

    container.addEventListener("click", handleClick);
    container.addEventListener("keydown", handleKeyDown);
    return () => {
      observer.disconnect();
      container.removeEventListener("click", handleClick);
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Keep the ref current and refresh the (localized) aria-label on UI-locale
  // change without rebuilding the observer/listeners above.
  useEffect(() => {
    tRef.current = t;
    containerRef.current?.querySelectorAll<HTMLImageElement>(HELP_IMAGE_SELECTOR).forEach((img) => {
      if (img.dataset.helpZoomable === "true") img.setAttribute("aria-label", t("help_center.view_image_full_screen"));
    });
  }, [t]);

  return (
    <div ref={containerRef} className="help-content-zoomable">
      {/*
        Help-reader-scoped prose tweaks (no change to the shared editor):
        - screenshots fill the column width (the read-only renderer otherwise
          falls back to ~35%, too small to read UI labels) — override the inline
          width with !important; aspect-ratio keeps height correct;
        - zoom-in cursor hints that article images open the full-screen viewer;
        - scroll-margin keeps a TOC jump's target below the 52px sticky header.
      */}
      <style>{`
        /* Read-only screenshots default to ~35% width via an inline px width on
           the image's wrapper divs (not just the <img>), so widen the wrappers
           AND the image to the full reading column — UI labels stay legible
           without zooming. aspect-ratio keeps the height correct. */
        .help-content-zoomable :has(> img.read-only-image),
        .help-content-zoomable :has(> div > img.read-only-image) {
          width: 100% !important;
          max-width: 100% !important;
          display: block !important;
          /* drop per-image center/right alignment offsets so a full-width image
             always sits flush (the ml-*/translate from alignment would otherwise
             push the now-100%-wide wrapper out of the column). */
          margin-left: 0 !important;
          margin-right: 0 !important;
          transform: none !important;
        }
        .help-content-zoomable img.read-only-image { cursor: zoom-in; width: 100% !important; height: auto !important; }
        /* Tables fill the reading column: the table node view writes an inline
           fixed px width (cell colwidth defaults to 150px when the source HTML
           carries no colwidth), which otherwise leaves seeded tables at ~half
           width. Drop it so columns size to content and the table fills 100%. */
        .help-content-zoomable .table-wrapper table { width: 100% !important; table-layout: auto !important; }
        .help-content-zoomable :is(h1, h2, h3) { scroll-margin-top: 4rem; }
      `}</style>
      {children}
      {zoomed && (
        <ImageFullScreenModal
          aspectRatio={zoomed.aspectRatio}
          downloadSrc={zoomed.src}
          isFullScreenEnabled
          isTouchDevice={isTouchDevice}
          src={zoomed.src}
          width={zoomed.width}
          toggleFullScreenMode={(open: boolean) => {
            if (!open) setZoomed(null);
          }}
        />
      )}
    </div>
  );
}
