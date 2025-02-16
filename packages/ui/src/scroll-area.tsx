"use client";
import * as RadixScrollArea from "@radix-ui/react-scroll-area";
import React, { FC } from "react";
import { cn } from "../helpers";

type TScrollAreaProps = {
  type?: "auto" | "always" | "scroll" | "hover";
  className?: string;
  scrollHideDelay?: number;
  children: React.ReactNode;
};

export const ScrollArea: FC<TScrollAreaProps> = (props) => {
  const { type = "always", className = "", scrollHideDelay = 600, children } = props;
  return (
    <RadixScrollArea.Root type={type} className={cn("overflow-hidden", className)} scrollHideDelay={scrollHideDelay}>
      <RadixScrollArea.Viewport className="size-full">{children}</RadixScrollArea.Viewport>
      <RadixScrollArea.Scrollbar
        className="group flex touch-none select-none bg-transparent p-0.5 transition-colors duration-[160ms] ease-out data-[orientation=horizontal]:h-2.5 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col"
        orientation="vertical"
      >
        <RadixScrollArea.Thumb className="relative flex-1 rounded-[10px] bg-custom-scrollbar-neutral group-hover:bg-custom-scrollbar-hover group-active:bg-custom-scrollbar-active before:absolute before:left-1/2 before:top-1/2 before:size-full before:min-h-11 before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2" />
      </RadixScrollArea.Scrollbar>
      <RadixScrollArea.Scrollbar
        className="group flex touch-none select-none bg-transparent p-0.5 transition-colors duration-[160ms] ease-out data-[orientation=horizontal]:h-2.5 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col"
        orientation="horizontal"
      >
        <RadixScrollArea.Thumb className="relative flex-1 rounded-[10px] bg-custom-scrollbar-neutral group-hover:bg-custom-scrollbar-hover group-active:bg-custom-scrollbar-active before:absolute before:left-1/2 before:top-1/2 before:size-full before:min-h-[44px] before:min-w-[44px] before:-translate-x-1/2 before:-translate-y-1/2" />
      </RadixScrollArea.Scrollbar>
    </RadixScrollArea.Root>
  );
};
