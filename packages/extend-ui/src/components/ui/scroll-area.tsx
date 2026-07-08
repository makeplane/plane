"use client";

import type React from "react";
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";

import { cn } from "../../lib/utils";

export function ScrollArea({
  className,
  children,
  orientation = "both",
  scrollFade = false,
  scrollbarGutter = false,
  scrollbarOverflowOnly = false,
  viewportClassName,
  viewportProps,
  viewportRef,
  ...props
}: ScrollAreaPrimitive.Root.Props & {
  orientation?: "vertical" | "horizontal" | "both";
  scrollFade?: boolean;
  scrollbarGutter?: boolean;
  scrollbarOverflowOnly?: boolean;
  viewportClassName?: string;
  viewportProps?: ScrollAreaPrimitive.Viewport.Props;
  viewportRef?: React.Ref<HTMLDivElement>;
}): React.ReactElement {
  const {
    className: viewportPropsClassName,
    key: viewportKey,
    ref: viewportPropsRef,
    ...resolvedViewportProps
  } = viewportProps ?? {};

  return (
    <ScrollAreaPrimitive.Root
      className={cn("size-full min-h-0", scrollbarOverflowOnly && "scrollbar-overflow-only", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        key={viewportKey}
        {...resolvedViewportProps}
        ref={composeRefs(viewportPropsRef, viewportRef)}
        className={cn(
          "transition-shadows focus-visible:ring-ring focus-visible:ring-offset-background h-full rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-offset-1 data-has-overflow-x:overscroll-x-contain data-has-overflow-y:overscroll-y-contain",
          scrollFade &&
            "mask-t-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-y-start)))] mask-r-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-x-end)))] mask-b-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-y-end)))] mask-l-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-x-start)))] [--fade-size:1.5rem]",
          scrollbarGutter && "data-has-overflow-x:pb-2.5 data-has-overflow-y:pe-2.5",
          viewportPropsClassName,
          viewportClassName
        )}
        data-slot="scroll-area-viewport"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {orientation !== "horizontal" ? <ScrollBar orientation="vertical" /> : null}
      {orientation !== "vertical" ? <ScrollBar orientation="horizontal" /> : null}
      {orientation === "both" ? <ScrollAreaPrimitive.Corner data-slot="scroll-area-corner" /> : null}
    </ScrollAreaPrimitive.Root>
  );
}

function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
  return (node) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === "function") {
        ref(node);
        return;
      }
      (ref as React.MutableRefObject<typeof node>).current = node;
    });
  };
}

export function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props): React.ReactElement {
  return (
    <ScrollAreaPrimitive.Scrollbar
      className={cn(
        "m-1 flex opacity-0 transition-opacity delay-300 data-hovering:opacity-100 data-hovering:delay-0 data-hovering:duration-100 data-scrolling:opacity-100 data-scrolling:delay-0 data-scrolling:duration-100 data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:flex-col data-[orientation=vertical]:w-1.5",
        className
      )}
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        className="bg-foreground/20 relative flex-1 rounded-full"
        data-slot="scroll-area-thumb"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollAreaPrimitive };
