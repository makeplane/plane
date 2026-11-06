/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { AiStarFourFilled } from "@makeplane/propel/icons";
import { cn } from "@plane/utils";
// components
import { Avatar, AvatarFallback } from "@/components/ui/shadcn/avatar";

type Props = { size?: "default" | "sm" | "lg"; className?: string };

/** Khaia's mark: a sparkle on the accent colour. Decorative; the name is always shown next to it. */
export function KhaiaAvatar({ size = "default", className }: Props) {
  return (
    <Avatar size={size} className={className} aria-hidden>
      <AvatarFallback className="bg-accent-primary text-on-color">
        <AiStarFourFilled className={cn(size === "lg" ? "size-5" : size === "sm" ? "size-3" : "size-4")} />
      </AvatarFallback>
    </Avatar>
  );
}
