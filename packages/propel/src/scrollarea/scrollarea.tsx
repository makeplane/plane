import * as React from "react";
import { ScrollArea as BaseScrollArea } from "@base-ui-components/react/scroll-area";

import { cn } from "../utils/classname";

type ScrollAreaOrientation = "horizontal" | "vertical";
type ScrollAreaScrollType = "always" | "scroll" | "hover";
type ScrollAreaSize = "sm" | "md" | "lg";

interface ScrollAreaProps extends React.ComponentProps<typeof BaseScrollArea.Root> {
  orientation?: ScrollAreaOrientation;
  scrollType?: ScrollAreaScrollType;
  size?: ScrollAreaSize;
  rootClassName?: string;
  viewportClassName?: string;
}

function ScrollArea({
  children,
  orientation,
  scrollType,
  size = "md",
  rootClassName,
  viewportClassName,
  ...props
}: ScrollAreaProps) {
  return (
    <BaseScrollArea.Root data-slot="scroll-area" className={cn("relative", rootClassName)} {...props}>
      <BaseScrollArea.Viewport
        data-slot="scroll-area-viewport"
        className={cn(
          "focus-visible:ring-ring/50 size-full overscroll-contain rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline",
          viewportClassName
        )}
      >
        {children}
      </BaseScrollArea.Viewport>
      <ScrollBar orientation={orientation} scrollType={scrollType} size={size} />
      <BaseScrollArea.Corner />
    </BaseScrollArea.Root>
  );
}

const horizontalSizeStyles = {
  sm: "p-[0.112rem] h-2.5",
  md: "p-[0.112rem] h-3",
  lg: "p-[0.112rem] h-4",
} as const;

const verticalSizeStyles = {
  sm: "p-[0.112rem] w-2.5",
  md: "p-[0.112rem] w-3",
  lg: "p-[0.112rem] w-4",
} as const;

const thumbSizeStyles = {
  sm: "before:absolute before:left-1/2 before:top-1/2 before:size-full before:min-h-11 before:-translate-x-1/2 before:-translate-y-1/2",
  md: "before:absolute before:left-1/2 before:top-1/2 before:size-full before:min-h-14 before:-translate-x-1/2 before:-translate-y-1/2",
  lg: "before:absolute before:left-1/2 before:top-1/2 before:size-full before:min-h-17 before:-translate-x-1/2 before:-translate-y-1/2",
} as const;

interface ScrollBarProps extends React.ComponentProps<typeof BaseScrollArea.Scrollbar> {
  scrollType?: ScrollAreaScrollType;
  size?: ScrollAreaSize;
}

const ScrollBar = React.memo(function ScrollBar({
  className,
  orientation = "vertical",
  scrollType = "always",
  size = "md",
  ...props
}: ScrollBarProps) {
  return (
    <BaseScrollArea.Scrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "group/track mr-1 flex justify-center rounded-sm bg-transparent opacity-0 transition-opacity delay-300 ",
        orientation === "vertical" && verticalSizeStyles[size],
        orientation === "horizontal" && horizontalSizeStyles[size],
        scrollType === "always" && "opacity-100",
        scrollType === "scroll" && "data-[scrolling]:opacity-100 data-[scrolling]:delay-0 data-[scrolling]:duration-75",
        scrollType === "hover" && "data-[hovering]:opacity-100 data-[hovering]:delay-0 data-[hovering]:duration-75",
        className
      )}
      {...props}
    >
      <BaseScrollArea.Thumb
        data-slot="scroll-area-thumb"
        className={cn(
          "relative flex-1 rounded-[10px] bg-scrollbar-thumb group-hover/track:bg-scrollbar-thumb-hover group-active/track:bg-scrollbar-thumb-active data-[scrolling]:bg-scrollbar-thumb-active",
          thumbSizeStyles[size]
        )}
      />
    </BaseScrollArea.Scrollbar>
  );
});

export { ScrollArea };
export type { ScrollAreaProps, ScrollAreaOrientation, ScrollAreaScrollType, ScrollAreaSize };
