/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Beaker } from "lucide-react";
import { EUserPermissions } from "@plane/constants";
import type { TNavigationItem } from "@/components/workspace/sidebar/project-navigation";

export function testhubNavigationItems(workspaceSlug: string, projectId: string): TNavigationItem[] {
  return [
    {
      i18n_key: "testhub.sidebar",
      key: "testhub",
      name: "TestCopilot",
      href: `/${workspaceSlug}/projects/${projectId}/testhub`,
      icon: Beaker,
      access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
      shouldRender: true,
      sortOrder: 9,
    },
  ];
}
