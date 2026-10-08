/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@plane/utils";

type Props = {
  label: string;
  children: ReactNode;
  onRemove?: () => void;
  className?: string;
};

/** An applied filter: its name, its value picker and a remove button. */
export function FilterChip({ label, children, onRemove, className }: Props) {
  return (
    <div
      className={cn(
        "flex h-7 items-center gap-1 rounded-md border-[0.5px] border-subtle-1 bg-layer-2 pr-1 pl-2 text-13",
        className
      )}
    >
      <span className="text-tertiary">{label}:</span>
      <div className="flex min-w-0 items-center">{children}</div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={label}
          className="flex size-5 items-center justify-center rounded-sm text-tertiary hover:bg-layer-transparent-hover hover:text-primary"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}
