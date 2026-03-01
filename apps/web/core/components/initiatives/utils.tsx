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

import type { ReactElement } from "react";
import { uniq } from "lodash-es";
// plane
import { EIconSize, INITIATIVE_STATES } from "@plane/constants";
import { InitiativeStateIcon } from "@plane/propel/icons";
import type {
  ISearchIssueResponse,
  IUserLite,
  TInitiativeGroupByOptions,
  TInitiativeLabel,
  TInitiativeStates,
} from "@plane/types";
import { Avatar } from "@plane/ui";
// helpers
import { getFileURL } from "@plane/utils";

// PLane-web
import { rootStore } from "@/lib/store-context";
import type { TInitiative } from "@/types";

export type TInitiativeGroup = {
  id: string;
  name: string;
  icon?: ReactElement;
};

export const getGroupList = (
  groupIds: string[],
  groupBy: TInitiativeGroupByOptions,
  getUserDetails: (userId: string) => IUserLite | undefined
): TInitiativeGroup[] => {
  if (!groupIds?.length) return [];

  const workspaceSlug = rootStore.router.workspaceSlug;
  const { getInitiativesLabels } = rootStore.initiativeStore;

  const sorters: Record<string, (a: string, b: string) => number> = {
    state: (a, b) =>
      INITIATIVE_STATES[a as TInitiativeStates].sortOrder - INITIATIVE_STATES[b as TInitiativeStates].sortOrder,
    label_ids: () => 0,
    lead: (a, b) => {
      if (a === "None") return 1;
      if (b === "None") return -1;
      return a.localeCompare(b);
    },
    created_by: (a, b) => {
      if (a === "None") return 1;
      if (b === "None") return -1;
      return a.localeCompare(b);
    },
    default: (a, b) => {
      if (a === "None") return 1;
      if (b === "None") return -1;
      return a.localeCompare(b);
    },
  };

  const sorter = sorters[groupBy ?? "default"] ?? sorters.default;

  const sortedGroupIds =
    groupBy === "state"
      ? (Object.keys(INITIATIVE_STATES) as TInitiativeStates[]).sort(sorters.state)
      : [...groupIds].sort(sorter);

  const buildNoneItem = (icon: ReactElement): TInitiativeGroup => ({
    id: "None",
    name: "None",
    icon: icon || undefined,
  });

  const groupList: TInitiativeGroup[] = [];

  switch (groupBy) {
    case undefined: {
      return sortedGroupIds.map((id) => ({ id, name: id }));
    }

    case "created_by":
    case "lead": {
      for (const id of sortedGroupIds) {
        if (id === "None") {
          groupList.push(buildNoneItem(<Avatar size="md" />));
          continue;
        }

        const member = getUserDetails(id);
        if (!member) continue;

        groupList.push({
          id,
          name: member.display_name,
          icon: <Avatar name={member.display_name} src={getFileURL(member.avatar_url ?? "")} size="md" />,
        });
      }
      break;
    }

    case "state": {
      for (const id of sortedGroupIds) {
        const state = INITIATIVE_STATES[id as TInitiativeStates];
        groupList.push({
          id,
          name: state.title,
          icon: <InitiativeStateIcon state={id as TInitiativeStates} size={EIconSize.LG} />,
        });
      }
      break;
    }

    case "label_ids": {
      if (!workspaceSlug) return [];
      const labelsMap = getInitiativesLabels(workspaceSlug);

      const labelGroups = sortedGroupIds
        .filter((id) => id !== "None")
        .map((id) => {
          const label = labelsMap?.get(id);
          return label ? { id, label } : null;
        })
        .filter((x): x is { id: string; label: TInitiativeLabel } => x !== null)
        .sort((a, b) => (a.label.sort_order ?? 0) - (b.label.sort_order ?? 0));

      for (const { id, label } of labelGroups) {
        groupList.push({
          id,
          name: label.name,
          icon: <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />,
        });
      }

      if (sortedGroupIds.includes("None")) {
        groupList.push(
          buildNoneItem(<div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: "#666" }} />)
        );
      }
      break;
    }

    default:
      return sortedGroupIds.map((id) => ({ id, name: id }));
  }

  return groupList;
};

/**
 * Retrieves detailed epic information for selected epic IDs from stores
 * Used in initiative epic selection modals to display selected epics with complete details
 * @param selectedEpicIds - Array of epic IDs currently selected
 * @param workspaceSlug - Workspace slug identifier
 * @returns Array of epic details formatted for search/selection interfaces
 */
export const getSelectedEpicDetails = (selectedEpicIds: string[], workspaceSlug: string): ISearchIssueResponse[] => {
  const selectedEpicDetails: ISearchIssueResponse[] = [];

  // Store references for data fetching
  const issueStore = rootStore.issue.issues;
  const projectStore = rootStore.projectRoot.project;
  const projectStateStore = rootStore.state;

  selectedEpicIds.forEach((epicId) => {
    // Fetch related data from different stores
    const epicIssue = issueStore.getIssueById(epicId);
    const epicProject = projectStore.getProjectById(epicIssue?.project_id);
    const epicState = projectStateStore.getStateById(epicIssue?.state_id);

    // Skip if any required data is missing
    if (!epicIssue || !epicProject || !epicState || !epicIssue.type_id) return;

    // Construct epic details object following ISearchIssueResponse interface
    selectedEpicDetails.push({
      id: epicIssue.id,
      name: epicIssue.name,
      project_id: epicProject.id,
      project__identifier: epicProject.identifier,
      project__name: epicProject.name,
      sequence_id: epicIssue.sequence_id,
      start_date: epicIssue.start_date,
      type_id: epicIssue.type_id,
      workspace__slug: workspaceSlug,
      state__color: epicState.color,
      state__group: epicState.group,
      state__name: epicState.name,
    });
  });

  return selectedEpicDetails;
};

/**
 * Retrieves the update payload for an initiative based on the group by option
 * @param groupBy - The group by option
 * @param sourceId - The source initiative ID
 * @param sourceGroupId - The source group ID
 * @param destinationGroupId - The destination group ID
 * @param initiativesMap - The initiatives map
 * @returns The update payload
 */
export const getInitiativeUpdatePayload = (
  groupBy: TInitiativeGroupByOptions,
  sourceId: string,
  sourceGroupId: string,
  destinationGroupId: string,
  initiativesMap: Record<string, TInitiative>
): Partial<TInitiative> | null => {
  switch (groupBy) {
    case "state":
      return { state: destinationGroupId as TInitiativeStates };

    case "label_ids": {
      if (!initiativesMap[sourceId]) return null;
      const currentLabels = initiativesMap[sourceId].label_ids || [];

      let updatedLabels = [...currentLabels];

      updatedLabels = updatedLabels.filter((id) => id !== sourceGroupId);

      if (destinationGroupId !== "None") {
        updatedLabels = uniq([...updatedLabels, destinationGroupId]);
      }

      return { label_ids: updatedLabels };
    }

    case "lead":
      return { lead: destinationGroupId === "None" ? null : destinationGroupId };

    default:
      return null;
  }
};
