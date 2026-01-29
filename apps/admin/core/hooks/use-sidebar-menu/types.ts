/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { LucideIcon } from "lucide-react";

export type TSidebarMenuItem = {
  Icon: LucideIcon | React.ComponentType<{ className?: string }>;
  name: string;
  description: string;
  href: string;
};
