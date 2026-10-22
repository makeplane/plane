/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IconGlyph } from "@makeplane/propel/components/icon";

export type TSidebarMenuItem = {
  Icon: IconGlyph | React.ComponentType<{ className?: string }>;
  name: string;
  description: string;
  href: string;
};
