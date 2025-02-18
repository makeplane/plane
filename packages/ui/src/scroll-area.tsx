"use client";
import * as RadixScrollArea from "@radix-ui/react-scroll-area";
import React, { FC } from "react";
import { cn } from "../helpers";

type TScrollAreaProps = {
  type?: "auto" | "always" | "scroll" | "hover";
  className?: string;
  scrollHideDelay?: number;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
};

const sizeStyles = {
  sm: "p-[0.112rem] data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:h-2.5",
  md: "p-[0.152rem] data-[orientation=vertical]:w-3 data-[orientation=horizontal]:h-3",
  lg: "p-[0.225rem] data-[orientation=vertical]:w-4 data-[orientation=horizontal]:h-4",
};

const thumbSizeStyles = {
  sm: "before:absolute before:left-1/2 before:top-1/2 before:size-full before:min-h-11 before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2",
  md: "before:absolute before:left-1/2 before:top-1/2 before:size-full before:min-h-14 before:min-w-14 before:-translate-x-1/2 before:-translate-y-1/2",
  lg: "before:absolute before:left-1/2 before:top-1/2 before:size-full before:min-h-17 before:min-w-17 before:-translate-x-1/2 before:-translate-y-1/2",
};

export const ScrollArea: FC<TScrollAreaProps> = (props) => {
  const { type = "always", className = "", scrollHideDelay = 600, size = "md", children } = props;

  return (
    <RadixScrollArea.Root
      type={type}
      className={cn("group overflow-hidden", className)}
      scrollHideDelay={scrollHideDelay}
    >
      <RadixScrollArea.Viewport className="size-full">{children}</RadixScrollArea.Viewport>
      <RadixScrollArea.Scrollbar
        className={cn(
          "group/track flex touch-none select-none bg-transparent transition-colors duration-[160ms] ease-out",
          sizeStyles[size]
        )}
        orientation="vertical"
      >
        <RadixScrollArea.Thumb
          className={cn(
            "relative flex-1 rounded-[10px]  bg-custom-scrollbar-neutral group-hover:bg-custom-scrollbar-hover group-active/track:bg-custom-scrollbar-active",
            thumbSizeStyles[size]
          )}
        />
      </RadixScrollArea.Scrollbar>
      <RadixScrollArea.Scrollbar
        className={cn(
          "group/track flex touch-none select-none bg-transparent transition-colors duration-[160ms] ease-out",
          sizeStyles[size]
        )}
        orientation="horizontal"
      >
        <RadixScrollArea.Thumb
          className={cn(
            "relative flex-1 rounded-[10px] bg-custom-scrollbar-neutral group-hover:bg-custom-scrollbar-hover group-active/track:bg-custom-scrollbar-active",
            thumbSizeStyles[size]
          )}
        />
      </RadixScrollArea.Scrollbar>
    </RadixScrollArea.Root>
  );
};
