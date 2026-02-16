/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";
import { Crown } from "lucide-react";
// helpers
import { cn } from "@plane/utils";

type TProIcon = {
  className?: string;
};

export function ProIcon(props: TProIcon) {
  const { className } = props;

  return <Crown className={cn("inline-block h-3.5 w-3.5 text-amber-400", className)} />;
}
