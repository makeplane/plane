/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { cn } from "@plane/utils";

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-success-subtle text-success-primary",
  POST: "bg-warning-subtle text-warning-primary",
  PUT: "bg-accent-subtle text-accent-primary",
  PATCH: "bg-accent-subtle text-accent-primary",
  DELETE: "bg-danger-subtle text-danger-primary",
  HEAD: "bg-layer-2 text-secondary",
  OPTIONS: "bg-layer-2 text-secondary",
};

export function MethodBadge({ method }: { method: string }) {
  const value = method.toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex min-w-12 shrink-0 items-center justify-center rounded-sm px-1.5 py-0.5 text-11 font-semibold",
        METHOD_STYLES[value] ?? "bg-layer-2 text-secondary"
      )}
    >
      {value}
    </span>
  );
}
