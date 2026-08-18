/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { FolderGit2 } from "lucide-react";
import { EUserPermissions } from "@plane/constants";
import type { TNavigationItem } from "@/components/workspace/sidebar/project-navigation";

export function gitsyncNavigationItems(workspaceSlug: string, projectId: string): TNavigationItem[] {
  return [
    {
      i18n_key: "gitsync.sidebar",
      key: "gitsync",
      name: "Configuration",
      href: `/${workspaceSlug}/projects/${projectId}/gitsync`,
      icon: FolderGit2,
      access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
      shouldRender: true,
      sortOrder: 11,
    },
  ];
}
