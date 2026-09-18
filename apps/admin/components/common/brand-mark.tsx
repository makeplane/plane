/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { BRAND_SHORT_NAME } from "@plane/constants";
import { cn } from "@plane/utils";

type TBrandMark = {
  className?: string;
};

export function BrandMark({ className }: TBrandMark) {
  return (
    <span className={cn("inline-flex items-center gap-1 font-semibold tracking-tight", className)}>
      <img
        alt=""
        aria-hidden="true"
        className="h-full min-h-[1em] w-auto shrink-0 rounded-sm bg-white object-contain p-px"
        src="/pilogo.svg"
      />
      <span>{BRAND_SHORT_NAME}</span>
    </span>
  );
}
