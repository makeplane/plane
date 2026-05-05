/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { LucideIcon } from "lucide-react";
import type { TNetworkChoiceIconKey } from "@plane/constants";
import type { ISvgIcons } from "@plane/propel/icons";
// plane imports
import { GlobeIcon, LockIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";

type Props = {
  iconKey: TNetworkChoiceIconKey;
  className?: string;
};

// Static icon mapping - declared at module level for React Compiler
const ICON_MAP: Record<TNetworkChoiceIconKey, LucideIcon | React.FC<ISvgIcons> | null> = {
  Lock: LockIcon,
  Globe2: GlobeIcon,
};

export function ProjectNetworkIcon(props: Props) {
  const { iconKey, className } = props;

  const Icon = ICON_MAP[iconKey] ?? null;
  if (!Icon) return null;

  return <Icon className={cn("h-3 w-3", className)} />;
}
