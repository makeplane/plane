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

  const isTouchDevice = useMemo(
    () => typeof window !== "undefined" && ("ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0),
    []
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // make content images focusable, button-like targets (announced to AT)
    const enhance = () => {
      container.querySelectorAll<HTMLImageElement>(HELP_IMAGE_SELECTOR).forEach((img) => {
        img.setAttribute("aria-label", t("help_center.view_image_full_screen"));
        if (img.dataset.helpZoomable === "true") return;
        img.dataset.helpZoomable = "true";
        img.setAttribute("role", "button");
        img.setAttribute("tabindex", "0");
      });
    };
    enhance();
    // re-enhance images added after hydration / on locale or article change
    const observer = new MutationObserver(() => enhance());
    observer.observe(container, { childList: true, subtree: true });

    const handleClick = (event: MouseEvent) => {
      const img = (event.target as HTMLElement | null)?.closest(HELP_IMAGE_SELECTOR) as HTMLImageElement | null;
      if (!img || !container.contains(img)) return;
      const next = computeZoom(img);
      if (!next) return;
      event.preventDefault();
      event.stopPropagation();
      setZoomed(next);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const img = (event.target as HTMLElement | null)?.closest(HELP_IMAGE_SELECTOR) as HTMLImageElement | null;
      if (!img || !container.contains(img)) return;
      const next = computeZoom(img);
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
  }, [t]);

  return (
    <div ref={containerRef} className="help-content-zoomable">
      {/* zoom-in cursor hints that article images are clickable */}
      <style>{`.help-content-zoomable img.read-only-image{cursor:zoom-in;}`}</style>
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
