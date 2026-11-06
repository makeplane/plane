/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// shadcn/ui Textarea (base-vega), mapped to Plane tokens. See ./README.md.
import type { ComponentProps } from "react";
import { cn } from "@plane/utils";

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-10 w-full resize-none rounded-md border border-subtle bg-transparent px-2.5 py-2 text-body-xs-regular text-primary transition-colors outline-none placeholder:text-placeholder focus-visible:border-accent-strong disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
