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
import { INITIATIVE_STATES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IBaseLayoutsBaseGroup, TInitiativeStates } from "@plane/types";
// components
import { BaseListLayout } from "@/components/base-layouts/list/layout";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// types
import type { TInitiative } from "@/types";
import type { TInitiativeItemPermissions } from "@/store/initiatives/permissions/root";
import { getGroupList, getInitiativeUpdatePayload } from "../../utils";
import { InitiativeBlock } from "../initiative-block";

type Props = {
  getInitiativePermissions: (initiative: TInitiative) => TInitiativeItemPermissions;
};

export const InitiativesListLayout = observer(function InitiativesListLayout(props: Props) {
  const { getInitiativePermissions } = props;
  const { t } = useTranslation();
  const { getUserDetails } = useMember();
  const { workspaceSlug } = useParams();

  const {
    initiative: { filteredInitiativesMap, currentGroupedFilteredInitiativeIds, updateInitiative, getInitiativesLabels },
    initiativeFilters,
  } = useInitiatives();

  const displayFilters = initiativeFilters.currentInitiativeDisplayFilters;
  const groupBy = displayFilters?.group_by;

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
        // Only show groups for members who are actually leads of initiatives
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
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroupedFilteredInitiativeIds, groupBy, getUserDetails, workspaceSlug]);

  // Only allow dragging for specific groupBy types
  const isDraggableGroupBy = groupBy === "lead" || groupBy === "state" || groupBy === "label_ids";
  const canDragFunction = useCallback(
    (item: TInitiative) => isDraggableGroupBy && !item?.archived_at && getInitiativePermissions(item).canDragAndDrop,
    [isDraggableGroupBy, getInitiativePermissions]
  );

  // Render each initiative item
  const renderItem = useCallback(
    (initiativeItem: TInitiative) => {
      const itemPerms = getInitiativePermissions(initiativeItem);
      return (
        <InitiativeBlock
          key={initiativeItem.id}
          initiativeId={initiativeItem.id}
          canEditProperty={itemPerms.canEditProperty}
          quickActionPermissions={itemPerms.quickActions}
        />
      );
    },
    [getInitiativePermissions]
  );

  // Handle drag and drop
  const handleDrop = useCallback(
    async (sourceId: string, destinationId: string | null, sourceGroupId: string, destinationGroupId: string) => {
      if (!workspaceSlug || !groupBy || !filteredInitiativesMap) return;

      if (sourceGroupId === destinationGroupId) return;

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
    [workspaceSlug, groupBy, updateInitiative, filteredInitiativesMap, t]
  );

  if (!filteredInitiativesMap || !currentGroupedFilteredInitiativeIds) return null;

  return (
    <BaseListLayout
      items={filteredInitiativesMap}
      groupedItemIds={currentGroupedFilteredInitiativeIds}
      groups={groups}
      renderItem={renderItem}
      canDrag={canDragFunction}
      onDrop={handleDrop}
      showEmptyGroups
    />
  );
});
