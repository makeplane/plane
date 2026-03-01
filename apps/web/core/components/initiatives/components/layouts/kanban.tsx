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
import { observer } from "mobx-react";
import { useParams } from "next/navigation";

// plane imports
import { EUserPermissionsLevel, INITIATIVE_STATES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EUserWorkspaceRoles } from "@plane/types";
import type { IBaseLayoutsBaseGroup, TInitiativeStates } from "@plane/types";

// components
import { BaseKanbanLayout } from "@/components/base-layouts/kanban/layout";

// hooks
import { useMember } from "@/hooks/store/use-member";
import { useUserPermissions } from "@/hooks/store/user";

// plane web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

// local imports
import { getGroupList, getInitiativeUpdatePayload } from "../../utils";
import { InitiativeKanbanCard } from "../initiative-kanban-card";

export const InitiativeKanbanLayout = observer(function InitiativeKanbanLayout() {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();

  const {
    initiative: { filteredInitiativesMap, currentGroupedFilteredInitiativeIds, updateInitiative, getInitiativesLabels },
    initiativeFilters,
  } = useInitiatives();

  const { allowPermissions } = useUserPermissions();
  const { getUserDetails } = useMember();

  const displayFilters = initiativeFilters.currentInitiativeDisplayFilters;
  const groupBy = displayFilters?.group_by;

  const isEditable = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const isDraggableGroupBy = groupBy === "lead" || groupBy === "state" || groupBy === "label_ids";
  const canDragFunction = useCallback(() => isEditable && isDraggableGroupBy, [isEditable, isDraggableGroupBy]);

  // Generate groups
  const groups: IBaseLayoutsBaseGroup[] = useMemo(() => {
    if (!currentGroupedFilteredInitiativeIds) return [];

    let groupIds = Object.keys(currentGroupedFilteredInitiativeIds);
    if (!workspaceSlug) return [];

    const expandGroups = (extra: string[] = [], includeNone = true) => {
      const ids = includeNone ? [...groupIds, ...extra, "None"] : [...groupIds, ...extra];
      groupIds = Array.from(new Set(ids));
    };

    switch (groupBy) {
      case "label_ids": {
        const allLabels = getInitiativesLabels(workspaceSlug.toString());
        if (allLabels) expandGroups(Array.from(allLabels.keys()));
        break;
      }

      case "lead": {
        expandGroups([]);
        break;
      }

      case "state": {
        expandGroups(Object.keys(INITIATIVE_STATES) as TInitiativeStates[], false);
        break;
      }

      default:
        break;
    }

    const groupList = getGroupList(groupIds, groupBy, getUserDetails);

    return groupList.map(({ id, name, icon }) => ({
      id,
      name: name === "All Initiatives" ? t("initiatives.all_initiatives") : name || "",
      icon,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroupedFilteredInitiativeIds, groupBy, getUserDetails, workspaceSlug]);

  // Render each initiative card
  const renderItem = useCallback(
    (initiativeItem: { id: string; [key: string]: unknown }, _groupId: string) => (
      <InitiativeKanbanCard key={initiativeItem.id} initiativeId={initiativeItem.id} />
    ),
    []
  );

  // Handle drag and drop
  const handleDrop = useCallback(
    async (sourceId: string, destinationId: string | null, sourceGroupId: string, destinationGroupId: string) => {
      if (!workspaceSlug || !groupBy || !filteredInitiativesMap) return;

      try {
        const updatePayload = getInitiativeUpdatePayload(
          groupBy,
          sourceId,
          sourceGroupId,
          destinationGroupId,
          filteredInitiativesMap
        );
        if (!updatePayload) return;
        await updateInitiative(workspaceSlug.toString(), sourceId, updatePayload);
      } catch (error) {
        console.error("Error updating initiative:", error);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("initiatives.toast.update_error"),
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspaceSlug, groupBy, updateInitiative, filteredInitiativesMap]
  );

  if (!filteredInitiativesMap || !currentGroupedFilteredInitiativeIds) return null;

  return (
    <BaseKanbanLayout
      items={filteredInitiativesMap}
      groupedItemIds={currentGroupedFilteredInitiativeIds}
      groups={groups}
      renderItem={renderItem}
      enableDragDrop={isEditable}
      onDrop={handleDrop}
      canDrag={canDragFunction}
      showEmptyGroups
    />
  );
});
