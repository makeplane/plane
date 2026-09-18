/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { cn } from "@plane/utils";

type Props = {
  children: ReactNode;
  gradient?: boolean;
  className?: string;
};

function DefaultLayout({ children, gradient = false, className }: Props) {
  return (
    <div className={cn(`h-screen w-full overflow-hidden ${gradient ? "" : "bg-surface-1"}`, className)}>{children}</div>
  );
}

export default DefaultLayout;
