/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useMemo } from "react";
import { isEmpty, size } from "lodash-es";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { EUserWorkspaceRoles } from "@plane/types";
// assets
import projectDark from "@/app/assets/empty-state/search/project-dark.webp?url";
import projectLight from "@/app/assets/empty-state/search/project-light.webp?url";
// components
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUserPermissions } from "@/hooks/store/user";
// plane web hooks
import { DEFAULT_INITIATIVE_LAYOUT } from "@/constants/initiative";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local imports
import InitiativeLayoutLoader from "./initiative-layout-loader";
import { InitiativeTimelineLayout } from "./layouts/timeline";
import { InitiativeKanbanLayout } from "./layouts/kanban";
import { InitiativesListLayout } from "./layouts/list";

interface IInitiativesRootProps {
  isArchived?: boolean;
}
export const InitiativesRoot = observer(function InitiativesRoot(props: IInitiativesRootProps) {
  const { isArchived = false } = props;
  // plane hooks
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  // store hooks
  const { initiative, initiativeFilters } = useInitiatives();
  const { toggleCreateInitiativeModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const groupedInitiativeIds = initiative.currentGroupedFilteredInitiativeIds;
  const displayFilters = initiativeFilters.currentInitiativeDisplayFilters;
  const activeLayout = displayFilters.layout;

  const searchedResolvedPath = resolvedTheme === "light" ? projectLight : projectDark;
  const hasWorkspaceMemberLevelPermissions = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const INITIATIVE_ACTIVE_LAYOUTS = useMemo(
    () => ({
      list: <InitiativesListLayout />,
      kanban: <InitiativeKanbanLayout />,
      gantt: <InitiativeTimelineLayout />,
    }),
    []
  );

  if (initiative.initiativesLoader || initiative.fetchingFilteredInitiatives)
    return <InitiativeLayoutLoader layout={activeLayout} />;

  const emptyGroupedInitiativeIds = Object.values(groupedInitiativeIds || {}).every(
    (arr) => Array.isArray(arr) && arr.length === 0
  );
  const isEmptyInitiatives = isEmpty(groupedInitiativeIds) || emptyGroupedInitiativeIds;

  if (emptyGroupedInitiativeIds && size(isArchived ? initiative.archivedInitiativeIds : initiative.initiativeIds) > 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <SimpleEmptyState
          title={t("initiatives.empty_state.search.title")}
          description={
            isArchived
              ? t("initiatives.empty_state.search.archived_description")
              : t("initiatives.empty_state.search.description")
          }
          assetPath={searchedResolvedPath}
        />
      </div>
    );
  }
  if (isEmptyInitiatives) {
    return (
      <EmptyStateDetailed
        assetKey="initiative"
        title={
          isArchived
            ? t("workspace_empty_state.archived_initiatives.title")
            : t("workspace_empty_state.initiatives.title")
        }
        description={
          isArchived
            ? t("workspace_empty_state.archived_initiatives.description")
            : t("workspace_empty_state.initiatives.description")
        }
        actions={
          isArchived
            ? undefined
            : [
                {
                  label: t("workspace_empty_state.initiatives.cta_primary"),
                  onClick: () => toggleCreateInitiativeModal({ isOpen: true, initiativeId: undefined }),
                  disabled: !hasWorkspaceMemberLevelPermissions,
                },
              ]
        }
      />
    );
  }

  return INITIATIVE_ACTIVE_LAYOUTS[activeLayout || DEFAULT_INITIATIVE_LAYOUT];
});
