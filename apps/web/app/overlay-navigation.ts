/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { environmentsNavigationItems } from "@/app/environments/navigation-items";
import { formulationNavigationItems } from "@/app/formulation/navigation-items";
import { gitsyncNavigationItems } from "@/app/gitsync/navigation-items";
import { testhubNavigationItems } from "@/app/testhub/navigation-items";
import type { TNavigationItem } from "@/components/workspace/sidebar/project-navigation";

export function overlayNavigationItems(workspaceSlug: string, projectId: string): TNavigationItem[] {
  return [
    ...formulationNavigationItems(workspaceSlug, projectId),
    ...environmentsNavigationItems(workspaceSlug, projectId),
    ...testhubNavigationItems(workspaceSlug, projectId),
    ...gitsyncNavigationItems(workspaceSlug, projectId),
  ];
}
