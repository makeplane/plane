/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import {
  AlignLeft,
  Calendar,
  CalendarClock,
  CheckSquare,
  ChevronDownCircle,
  CircleDot,
  Hash,
  Link,
  ListChecks,
  Mail,
  Palette,
  Type,
  type LucideIcon,
} from "lucide-react";
// plane imports
import { CUSTOM_FIELD_TYPE_CONFIG_MAP } from "@plane/constants";
import type { ECustomFieldType } from "@plane/types";
import { cn } from "@plane/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  Type,
  AlignLeft,
  Hash,
  ChevronDownCircle,
  ListChecks,
  CheckSquare,
  CircleDot,
  Calendar,
  CalendarClock,
  Palette,
  Link,
  Mail,
};

type Props = {
  type: ECustomFieldType;
  className?: string;
};

export function FieldTypeIcon({ type, className }: Props) {
  const config = CUSTOM_FIELD_TYPE_CONFIG_MAP[type];
  const Icon = ICON_MAP[config?.icon ?? "Type"] ?? Type;
  return <Icon className={cn("size-4", className)} />;
}
