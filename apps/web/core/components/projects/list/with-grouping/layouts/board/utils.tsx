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

// "states" | "state_groups" | "priority" | "created_by";

import smoothScrollIntoView from "smooth-scroll-into-view-if-needed";
import { Avatar } from "@plane/propel/avatar";
import { LabelPropertyIcon, PriorityIcon } from "@plane/propel/icons";
import type { IBaseLabel, IWorkspace, IWorkspaceMember } from "@plane/types";
import { getFileURL } from "@plane/utils";
import { HIGHLIGHT_CLASS, HIGHLIGHT_WITH_LINE } from "@/helpers/common";
import { ProjectStateIcon } from "@/components/workspace-project-states";
import { PROJECT_PRIORITY_MAP } from "@/constants/project";
import { WORKSPACE_PROJECT_STATE_GROUPS } from "@/constants/workspace-project-states";
import type { GroupDetails, TProjectPriority } from "@/types/workspace-project-filters";
import type { EProjectStateGroup, TProjectState, TProjectStateGroupKey } from "@/types/workspace-project-states";

export const highlightProjectOnDrop = (
  elementId: string | undefined,
  shouldScrollIntoView = true,
  shouldHighLightWithLine = false
) => {
  setTimeout(async () => {
    const sourceElementId = elementId ?? "";
    const sourceElement = document.getElementById(sourceElementId);
    sourceElement?.classList?.add(shouldHighLightWithLine ? HIGHLIGHT_WITH_LINE : HIGHLIGHT_CLASS);
    if (shouldScrollIntoView && sourceElement)
      await smoothScrollIntoView(sourceElement, { behavior: "smooth", block: "center", duration: 1500 });
    setTimeout(() => {
      sourceElement?.classList?.remove(shouldHighLightWithLine ? HIGHLIGHT_WITH_LINE : HIGHLIGHT_CLASS);
    }, 2000);
  }, 200);
};
type GroupDetailsOptions = {
  getProjectStateById: (projectStateId: string) => TProjectState | undefined;
  getProjectStatedByStateGroupKey: (
    workspaceId: string,
    groupKey: TProjectStateGroupKey
  ) => TProjectState[] | undefined;
  getWorkspaceMemberDetails: (workspaceMemberId: string) => IWorkspaceMember | null;
  groupByKey: string;
  currentWorkspace: IWorkspace | null;
  selectedGroupKey: string | undefined;
  getLabelById?: (labelId: string) => IBaseLabel | undefined;
};

export const groupDetails = (options: GroupDetailsOptions): GroupDetails | undefined => {
  const {
    getProjectStateById,
    getProjectStatedByStateGroupKey,
    getWorkspaceMemberDetails,
    groupByKey,
    currentWorkspace,
    selectedGroupKey,
    getLabelById,
  } = options;
  switch (selectedGroupKey) {
    case "states": {
      const state = getProjectStateById(groupByKey);
      const groupKey = state?.group;
      return {
        title: state?.name || "State",
        icon: <ProjectStateIcon projectStateGroup={groupKey} width="14" height="14" />,
        prePopulatedPayload: {
          state_id: state && state?.id,
        },
      };
    }
    case "state_groups": {
      const groupKey = groupByKey as TProjectStateGroupKey;
      const stateGroup = WORKSPACE_PROJECT_STATE_GROUPS[groupKey];
      const states =
        currentWorkspace && getProjectStatedByStateGroupKey(currentWorkspace.id, groupByKey as EProjectStateGroup);
      return {
        title: stateGroup?.title || "State Group",
        icon: <ProjectStateIcon projectStateGroup={groupKey} width="14" height="14" />,
        prePopulatedPayload: {
          state_id: states && states.length > 0 && states[0].id,
        },
      };
    }
    case "priority": {
      const priorityKey = groupByKey as TProjectPriority;
      const priority = PROJECT_PRIORITY_MAP[priorityKey];
      return {
        title: priority?.label || "Priority",
        icon: <PriorityIcon priority={priority.key} className={`h-4 w-4`} />,
        prePopulatedPayload: {
          priority: priority.key,
        },
      };
    }
    case "created_by": {
      const member = getWorkspaceMemberDetails(groupByKey);
      if (!member?.member) return { title: "Created By", icon: <></>, prePopulatedPayload: {} };
      const memberDetails = member?.member;
      return {
        title: memberDetails?.display_name || "Created By",
        icon: memberDetails ? (
          <Avatar
            name={memberDetails.display_name}
            src={getFileURL(memberDetails.avatar_url)}
            showTooltip={false}
            size="md"
          />
        ) : (
          <></>
        ),
        prePopulatedPayload: {},
      };
    }
    case "labels": {
      if (groupByKey === "no-label") {
        return {
          title: "No Label",
          icon: <LabelPropertyIcon className="h-3.5 w-3.5" />,
          prePopulatedPayload: {},
        };
      }
      const label = getLabelById?.(groupByKey);
      return {
        title: label?.name || "Label",
        icon: <LabelPropertyIcon color={label?.color} className="h-3 w-3 flex-shrink-0" />,
        prePopulatedPayload: { label_ids: [groupByKey] },
      };
    }
  }
};
