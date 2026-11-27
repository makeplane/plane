/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: items our features add to the project navigation (sidebar and tabs). The one hook
// the official navigation calls (components/navigation/use-navigation-items.ts,
// components/workspace/sidebar/projects-list-item.tsx); a new feature adds its item here.

import { useCallback } from "react";
import { EUserPermissions } from "@plane/constants";
import type { TNavigationItem } from "@/components/navigation/tab-navigation-root";
import { useActivityNavigationItems } from "./activity/use-activity";
import { DecisionsIcon } from "./decisions/decisions-icon";
import { useDecisionsEnabledProjects } from "./decisions/use-decisions";

export const DECISIONS_NAVIGATION_KEY = "liviere_decisions";

export const useLiviereNavigationItems = (workspaceSlug: string | undefined) => {
  const activityItems = useActivityNavigationItems(workspaceSlug);
  const { data: decisionProjectIds } = useDecisionsEnabledProjects(workspaceSlug);
  return useCallback(
    (slug: string, projectId: string): TNavigationItem[] => [
      ...activityItems(slug, projectId),
      {
        i18n_key: "liviere.decisions.title",
        key: DECISIONS_NAVIGATION_KEY,
        name: "Decisions",
        href: `/${slug}/projects/${projectId}/decisions`,
        icon: DecisionsIcon,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        shouldRender: !!decisionProjectIds?.includes(projectId),
        sortOrder: 8,
      },
    ],
    [activityItems, decisionProjectIds]
  );
};
