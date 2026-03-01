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
import { INITIATIVE_STATES, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { IBaseLayoutsBaseGroup, TGanttBlockUpdateData, TGanttDateUpdate, TInitiativeStates } from "@plane/types";
import { EUserWorkspaceRoles } from "@plane/types";
// components
import { BaseTimelineLayout } from "@/components/base-layouts/timeline/layout";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useUserPermissions } from "@/hooks/store/user";
// plane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TInitiative } from "@/types/initiative";
// local
import { getGroupList } from "../../utils";
import { InitiativeTimelineBlock, InitiativeTimelineSidebarBlock } from "../initiative-timeline-block";

export const InitiativeTimelineLayout = observer(function InitiativeTimelineLayout() {
  const { t } = useTranslation();
  const { allowPermissions } = useUserPermissions();
  const { getUserDetails, workspace } = useMember();
  const { workspaceSlug } = useParams();

  const {
    initiative: {
      filteredInitiativesMap,
      currentGroupedFilteredInitiativeIds,
      updateInitiative,
      getInitiativesLabels,
      initiativeTimelineItems,
    },
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
        const memberIds = workspace.workspaceMemberIds || [];
        expandGroups(memberIds);
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

  const isEditable = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  // Render initiative gantt block
  const renderBlock = useCallback(
    (initiative: TInitiative) => <InitiativeTimelineBlock key={initiative.id} initiativeId={initiative.id} />,
    []
  );

  // Render initiative sidebar block
  const renderSidebar = useCallback(
    (initiative: TInitiative) => <InitiativeTimelineSidebarBlock key={initiative.id} initiativeId={initiative.id} />,
    []
  );

  // Handle block updates (drag, resize, reorder)
  const handleBlockUpdate = useCallback(
    async (initiative: TInitiative, payload: TGanttBlockUpdateData) => {
      if (!workspaceSlug || !filteredInitiativesMap) return;

      try {
        const updatePayload: Partial<TInitiative> = {};

        if (payload.start_date) {
          updatePayload.start_date = payload.start_date;
        }
        if (payload.target_date) {
          updatePayload.end_date = payload.target_date;
        }

        await updateInitiative(workspaceSlug.toString(), initiative.id, updatePayload);
      } catch (error) {
        console.error("Error updating initiative:", error);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("initiatives.toast.update_error"),
        });
      }
    },
    [workspaceSlug, updateInitiative, filteredInitiativesMap, t]
  );

  // Handle date updates (bulk updates, dependencies, etc.)
  const handleDateUpdate = useCallback(
    async (updates: TGanttDateUpdate[]) => {
      if (!workspaceSlug) return;

      try {
        // Update each initiative with new dates
        await Promise.all(
          updates.map((update) => {
            const payload: Partial<TInitiative> = {};
            if (update.start_date) payload.start_date = update.start_date;
            if (update.target_date) payload.end_date = update.target_date;
            return updateInitiative(workspaceSlug.toString(), update.id, payload);
          })
        );
      } catch (error) {
        console.error("Error updating initiative dates:", error);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("initiatives.toast.update_error"),
        });
      }
    },
    [workspaceSlug, updateInitiative, t]
  );

  if (!filteredInitiativesMap || !currentGroupedFilteredInitiativeIds) return null;

  return (
    <BaseTimelineLayout
      items={initiativeTimelineItems}
      groupedItemIds={currentGroupedFilteredInitiativeIds}
      groups={groups}
      renderBlock={renderBlock}
      renderSidebar={renderSidebar}
      onBlockUpdate={handleBlockUpdate}
      onDateUpdate={handleDateUpdate}
      enableBlockLeftResize={isEditable}
      enableBlockRightResize={isEditable}
      enableBlockMove={isEditable}
      enableAddBlock={isEditable}
      enableReorder={false} // Initiatives don't have sort_order field
      showAllBlocks
      showToday
      timelineType="INITIATIVE"
      title={t("initiatives.label", { count: 2 })}
      loaderTitle={t("initiatives.label", { count: 2 })}
    />
  );
});
