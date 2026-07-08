"use client";

import * as React from "react";

import { cn } from "../../lib/utils";

const INLINE_THUMBNAIL_SIDEBAR_MIN_WIDTH = 768;

export function useElementWidth<TElement extends HTMLElement>() {
  const ref = React.useRef<TElement | null>(null);
  const [width, setWidth] = React.useState(0);

  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const updateWidth = () => {
      const nextWidth = element.getBoundingClientRect().width;

      // Keep the last real measurement while the element is hidden or
      // detached (keep-alive preview pools, display:none ancestors): a
      // zero-width pass would re-lay-out the viewer for nothing, clearing
      // its rendered canvases, and force a blank-then-repaint flash when
      // the element comes back at its old size.
      if (nextWidth === 0) return;
      setWidth(nextWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

export function useInlineThumbnailSidebar(width: number) {
  return width >= INLINE_THUMBNAIL_SIDEBAR_MIN_WIDTH;
}

export function DocumentViewerThumbnailSidebar({
  children,
  className,
  closedInlineClassName = "-ml-40",
  inline,
  open,
  widthClassName = "w-40",
}: {
  children: React.ReactNode;
  className?: string;
  closedInlineClassName?: string;
  inline: boolean;
  open: boolean;
  widthClassName?: string;
}) {
  const [transitionsReady, setTransitionsReady] = React.useState(false);
  const shouldAnimateSidebar = transitionsReady && open;

  React.useEffect(() => {
    let secondFrameId = 0;
    const firstFrameId = window.requestAnimationFrame(() => {
      secondFrameId = window.requestAnimationFrame(() => {
        setTransitionsReady(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrameId);
      window.cancelAnimationFrame(secondFrameId);
    };
  }, []);

  return (
    <aside
      data-document-thumbnail-sidebar=""
      data-sidebar-mode={inline ? "inline" : "overlay"}
      data-sidebar-open={open ? "true" : "false"}
      className={cn(
        "bg-sidebar shadow-lg absolute inset-y-0 left-0 z-30 shrink-0 overflow-hidden border-r",
        widthClassName,
        shouldAnimateSidebar
          ? "transition-[translate,margin-left,border-color] duration-200 ease-out"
          : "transition-none",
        inline && "relative z-auto translate-x-0 shadow-none",
        open
          ? "ml-0 translate-x-0"
          : inline
            ? cn("pointer-events-auto border-r-0", closedInlineClassName)
            : "pointer-events-none -translate-x-full border-r-0",
        className
      )}
    >
      {children}
    </aside>
  );
}

export function DocumentViewerSidebarSkeleton({ className, inline }: { className?: string; inline: boolean }) {
  if (!inline) return null;

  return (
    <div className={cn("bg-sidebar w-40 shrink-0 border-r p-4", className)}>
      <div className="bg-background shadow-xs mx-auto h-28 w-20 overflow-hidden rounded-md">
        <div className="bg-muted h-full animate-pulse" />
      </div>
      <div className="bg-muted mx-auto mt-3 h-3 w-10 rounded-full" />
    </div>
  );
}
