/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Globe } from "lucide-react";
import { EUserPermissions } from "@plane/constants";
import type { TNavigationItem } from "@/components/workspace/sidebar/project-navigation";

export function environmentsNavigationItems(workspaceSlug: string, projectId: string): TNavigationItem[] {
  return [
    {
      i18n_key: "environments.sidebar",
      key: "environments",
      name: "Environment",
      href: `/${workspaceSlug}/projects/${projectId}/environments`,
      icon: Globe,
      access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
      shouldRender: true,
      sortOrder: 8,
    },
  ];
}
