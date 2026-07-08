"use client";

import type React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";

import { cn } from "../../lib/utils";

export function Card({ className, render, ...props }: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      "bg-card text-card-foreground shadow-xs/5 relative flex flex-col rounded-2xl border not-dark:bg-clip-padding before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-2xl)-1px)] before:shadow-[0_1px_--theme(--color-black/4%)] dark:before:shadow-[0_-1px_--theme(--color-white/6%)]",
      className
    ),
    "data-slot": "card",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardFrame({ className, render, ...props }: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      "bg-card text-card-foreground shadow-xs/5 before:bg-muted/72 relative flex flex-col rounded-2xl border [--clip-bottom:-1rem] [--clip-top:-1rem] not-dark:bg-clip-padding before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-2xl)-1px)] before:shadow-[0_1px_--theme(--color-black/4%)] has-data-[slot=table-container]:overflow-hidden *:data-[slot=card]:-m-px *:data-[slot=card]:bg-clip-padding *:data-[slot=card]:shadow-none *:data-[slot=card]:[clip-path:inset(var(--clip-top)_1px_var(--clip-bottom)_1px_round_calc(var(--radius-2xl)-1px))] *:not-first:data-[slot=card]:rounded-t-xl *:not-last:data-[slot=card]:rounded-b-xl *:data-[slot=card]:before:hidden *:not-first:data-[slot=card]:before:rounded-t-[calc(var(--radius-xl)-1px)] *:not-last:data-[slot=card]:before:rounded-b-[calc(var(--radius-xl)-1px)] *:data-[slot=card]:first:[--clip-top:1px] *:data-[slot=card]:last:[--clip-bottom:1px] *:data-[slot=table-container]:-m-px *:data-[slot=table-container]:w-[calc(100%+2px)] dark:before:shadow-[0_-1px_--theme(--color-white/6%)]",
      className
    ),
    "data-slot": "card-frame",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardFrameHeader({ className, render, ...props }: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      "relative flex grid auto-rows-min grid-rows-[auto_auto] flex-col items-start gap-x-4 px-6 py-4 has-data-[slot=card-frame-action]:grid-cols-[1fr_auto]",
      className
    ),
    "data-slot": "card-frame-header",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardFrameTitle({ className, render, ...props }: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn("text-sm self-center font-semibold", className),
    "data-slot": "card-frame-title",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardFrameDescription({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn("text-sm text-muted-foreground self-center", className),
    "data-slot": "card-frame-description",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardFrameAction({ className, render, ...props }: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn("col-start-2 inline-flex self-center justify-self-end nth-3:row-span-2 nth-3:row-start-1", className),
    "data-slot": "card-frame-action",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardFrameFooter({ className, render, ...props }: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn("px-6 py-4", className),
    "data-slot": "card-frame-footer",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardHeader({ className, render, ...props }: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      "grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 p-6 in-[[data-slot=card]:has(>[data-slot=card-panel])]:pb-4 has-data-[slot=card-action]:grid-cols-[1fr_auto]",
      className
    ),
    "data-slot": "card-header",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardTitle({ className, render, ...props }: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn("text-lg leading-none font-semibold", className),
    "data-slot": "card-title",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardDescription({ className, render, ...props }: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn("text-sm text-muted-foreground", className),
    "data-slot": "card-description",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardAction({ className, render, ...props }: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn("col-start-2 row-span-2 row-start-1 inline-flex self-start justify-self-end", className),
    "data-slot": "card-action",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardPanel({ className, render, ...props }: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn(
      "flex-1 p-6 in-[[data-slot=card]:has(>[data-slot=card-footer]:not(.border-t))]:pb-0 in-[[data-slot=card]:has(>[data-slot=card-header]:not(.border-b))]:pt-0",
      className
    ),
    "data-slot": "card-panel",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export function CardFooter({ className, render, ...props }: useRender.ComponentProps<"div">): React.ReactElement {
  const defaultProps = {
    className: cn("flex items-center p-6 in-[[data-slot=card]:has(>[data-slot=card-panel])]:pt-4", className),
    "data-slot": "card-footer",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  });
}

export { CardPanel as CardContent };
