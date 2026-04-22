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

import { useCallback, useMemo } from "react";
import { isEmpty, size } from "lodash-es";
import { observer } from "mobx-react";
import { useTheme } from "@plane/react-theme";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
// assets
import projectDark from "@/app/assets/empty-state/search/project-dark.webp?url";
import projectLight from "@/app/assets/empty-state/search/project-light.webp?url";
// components
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
// plane web hooks
import { DEFAULT_INITIATIVE_LAYOUT } from "@/constants/initiative";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TInitiativeItemPermissions, TInitiativeProperty } from "@/store/initiatives/permissions/root";
import type { TInitiative } from "@/types";
// local imports
import InitiativeLayoutLoader from "./initiative-layout-loader";
import { InitiativeTimelineLayout } from "./layouts/timeline";
import { InitiativeKanbanLayout } from "./layouts/kanban";
import { InitiativesListLayout } from "./layouts/list";

type Props = {
  workspaceSlug: string;
  isArchived?: boolean;
};

export const InitiativesRoot = observer(function InitiativesRoot(props: Props) {
  const { workspaceSlug, isArchived = false } = props;
  // plane hooks
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  // store hooks
  const {
    initiative: {
      permissions: { getCanEditProperty, getCanDragAndDrop, getCanEdit, getCanDelete, getCanCreate },
      currentGroupedFilteredInitiativeIds,
      archivedInitiativeIds,
      initiativeIds,
      initiativesLoader,
      fetchingFilteredInitiatives,
    },
    initiativeFilters,
  } = useInitiatives();
  const { toggleCreateInitiativeModal } = useCommandPalette();
  // derived values
  const groupedInitiativeIds = currentGroupedFilteredInitiativeIds;
  const displayFilters = initiativeFilters.currentInitiativeDisplayFilters;
  const activeLayout = displayFilters.layout;

  // Per-item: called once per initiative when rendering in list/kanban
  const getInitiativePermissions = useCallback(
    (initiativeItem: TInitiative): TInitiativeItemPermissions => ({
      canEditProperty: (property: TInitiativeProperty) =>
        getCanEditProperty(workspaceSlug, initiativeItem.id, property),
      canDragAndDrop: getCanDragAndDrop(workspaceSlug, initiativeItem.id),
      quickActions: {
        canEdit: getCanEdit(workspaceSlug, initiativeItem.id),
        canDelete: getCanDelete(workspaceSlug, initiativeItem.id),
      },
    }),
    [workspaceSlug, getCanEditProperty, getCanDragAndDrop, getCanEdit, getCanDelete]
  );

  const searchedResolvedPath = resolvedTheme === "light" ? projectLight : projectDark;

  const INITIATIVE_ACTIVE_LAYOUTS = useMemo(
    () => ({
      list: <InitiativesListLayout getInitiativePermissions={getInitiativePermissions} />,
      kanban: <InitiativeKanbanLayout getInitiativePermissions={getInitiativePermissions} />,
      gantt: (
        <InitiativeTimelineLayout
          permissions={{
            canEditViaTimeline: (blockId) => getCanEdit(workspaceSlug, blockId),
          }}
        />
      ),
    }),
    [getInitiativePermissions, getCanEdit, workspaceSlug]
  );

  if (initiativesLoader || fetchingFilteredInitiatives) return <InitiativeLayoutLoader layout={activeLayout} />;

  const emptyGroupedInitiativeIds = Object.values(groupedInitiativeIds || {}).every(
    (arr) => Array.isArray(arr) && arr.length === 0
  );
  const isEmptyInitiatives = isEmpty(groupedInitiativeIds) || emptyGroupedInitiativeIds;

  if (emptyGroupedInitiativeIds && size(isArchived ? archivedInitiativeIds : initiativeIds) > 0) {
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
                  disabled: !getCanCreate(workspaceSlug),
                },
              ]
        }
      />
    );
  }

  return INITIATIVE_ACTIVE_LAYOUTS[activeLayout || DEFAULT_INITIATIVE_LAYOUT];
});
