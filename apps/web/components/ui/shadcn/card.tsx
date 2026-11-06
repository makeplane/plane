/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// shadcn/ui Card (base-vega), mapped to Plane tokens. See ./README.md.
import type { ComponentProps } from "react";
import { cn } from "@plane/utils";

function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-subtle bg-surface-1 text-primary shadow-raised-200",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min items-center gap-x-3 gap-y-0.5 px-4 py-3 has-data-[slot=card-action]:grid-cols-[auto_1fr_auto] [.border-b]:border-subtle",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("text-body-sm-medium text-primary", className)} {...props} />;
}

function CardDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="card-description" className={cn("text-caption-md-regular text-tertiary", className)} {...props} />
  );
}

function CardAction({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("flex items-center gap-0.5 self-center justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("min-h-0 flex-1", className)} {...props} />;
}

function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("px-3 py-3 [.border-t]:border-subtle", className)} {...props} />;
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
