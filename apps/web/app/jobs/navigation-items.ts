/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ListTodo } from "lucide-react";
import { EUserPermissions } from "@plane/constants";
import type { TNavigationItem } from "@/components/workspace/sidebar/project-navigation";

export function jobsNavigationItems(workspaceSlug: string, projectId: string): TNavigationItem[] {
  return [
    {
      i18n_key: "jobs.sidebar",
      key: "jobs",
      name: "Jobs",
      href: `/${workspaceSlug}/projects/${projectId}/jobs`,
      icon: ListTodo,
      access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
      shouldRender: true,
      sortOrder: 10,
    },
  ];
}
