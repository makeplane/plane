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

import { uniq } from "lodash-es";
import { observer } from "mobx-react";
import { CircleMinus } from "lucide-react";
// plane imports
import { EditIcon, PriorityIcon, StateGroupIcon } from "@plane/propel/icons";
import type { EWorkItemTypeEntity, IIssueType, IState, IUserLite, TWorkItemBlueprintFormData } from "@plane/types";
import { Avatar, AvatarGroup, CustomMenu } from "@plane/ui";
import type { TProjectBlueprintDetails } from "@plane/utils";
import { cn, getFileURL } from "@plane/utils";
// plane web imports
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { useIssueTypes } from "@/plane-web/hooks/store";

type TWorkItemBlueprintListItemWithAdditionalPropsData = {
  usePropsForAdditionalData: true;
  getUserDetails: (userId: string) => IUserLite | undefined;
  getProjectById: (projectId: string | undefined | null) => TProjectBlueprintDetails | undefined;
  getStateById: (stateId: string | null | undefined) => IState | undefined;
  getWorkItemTypeById: (workItemType: string) => IIssueType | undefined;
  isWorkItemTypeEntityEnabled?: (workspaceSlug: string, projectId: string, entityType: EWorkItemTypeEntity) => boolean;
};

type TWorkItemBlueprintListItemWithMobxData = {
  usePropsForAdditionalData: false;
};

type TWorkItemBlueprintListItemProps = {
  allowEdit?: boolean;
  handleEdit?: () => void;
  handleDelete?: () => void;
  index: number;
  workItem: TWorkItemBlueprintFormData;
} & (TWorkItemBlueprintListItemWithAdditionalPropsData | TWorkItemBlueprintListItemWithMobxData);

export const WorkItemBlueprintListItem = observer(function WorkItemBlueprintListItem(
  props: TWorkItemBlueprintListItemProps
) {
  const { allowEdit = false, handleEdit, handleDelete, index, workItem, usePropsForAdditionalData } = props;
  // store hooks
  const { getProjectById: getProjectByIdFromStore } = useProject();
  const { getUserDetails: getUserDetailsFromStore } = useMember();
  const { getStateById: getStateByIdFromStore } = useProjectState();
  const { getIssueTypeById: getIssueTypeByIdFromStore, isWorkItemTypeEntityEnabledForProject } = useIssueTypes();
  // derived values
  const getProjectById = usePropsForAdditionalData ? props.getProjectById : getProjectByIdFromStore;
  const getUserDetails = usePropsForAdditionalData ? props.getUserDetails : getUserDetailsFromStore;
  const getStateById = usePropsForAdditionalData ? props.getStateById : getStateByIdFromStore;
  const getWorkItemTypeById = usePropsForAdditionalData ? props.getWorkItemTypeById : getIssueTypeByIdFromStore;
  const isWorkItemTypeEntityEnabled = usePropsForAdditionalData
    ? props.isWorkItemTypeEntityEnabled
    : isWorkItemTypeEntityEnabledForProject;
  const projectDetails = getProjectById(workItem.project_id);
  const workItemState = getStateById(workItem.state_id);

  return (
    <div
      className={cn("group relative flex min-h-10 w-full items-center gap-3 px-1.5 py-1 transition-all rounded", {
        "hover:bg-layer-transparent-hover cursor-pointer": allowEdit,
        "cursor-not-allowed": !allowEdit,
      })}
    >
      {projectDetails && (
        <div className={cn("flex-shrink-0", !allowEdit && "opacity-60")}>
          <IssueIdentifier
            getWorkItemTypeById={getWorkItemTypeById}
            isWorkItemTypeEntityEnabled={isWorkItemTypeEntityEnabled}
            projectId={projectDetails.id}
            issueTypeId={workItem.type_id}
            projectIdentifier={projectDetails.identifier}
            issueSequenceId={index + 1}
            size="sm"
            variant="secondary"
          />
        </div>
      )}
      <div className="flex w-full truncate items-center gap-3">
        <span className="w-full truncate text-body-xs-regular text-primary">{workItem.name}</span>
      </div>
      <div className={cn("flex items-center gap-3.5 flex-shrink-0 text-body-xs-regular", !allowEdit && "opacity-60")}>
        <PriorityIcon priority={workItem.priority} className="size-3.5 flex-shrink-0" withContainer />
        {workItemState && <StateGroupIcon stateGroup={workItemState.group} className="size-5 flex-shrink-0" />}
        {workItem.assignee_ids.length > 0 && (
          <AvatarGroup size="sm" showTooltip>
            {uniq(workItem.assignee_ids)?.map((userId: string) => {
              const userDetails = getUserDetails(userId);
              if (!userDetails) return;
              return <Avatar key={userId} src={getFileURL(userDetails.avatar_url)} name={userDetails.display_name} />;
            })}
          </AvatarGroup>
        )}
      </div>
      {allowEdit && (
        <div className="flex-shrink-0 text-body-xs-regular">
          <CustomMenu placement="bottom-end" ellipsis>
            {handleEdit && (
              <CustomMenu.MenuItem onClick={handleEdit}>
                <div className="flex items-center gap-2">
                  <EditIcon className="h-3.5 w-3.5" strokeWidth={2} />
                  <span>Edit</span>
                </div>
              </CustomMenu.MenuItem>
            )}
            {handleDelete && (
              <CustomMenu.MenuItem onClick={handleDelete}>
                <div className="flex items-center gap-2 text-danger-primary">
                  <CircleMinus className="h-3.5 w-3.5" strokeWidth={2} />
                  <span>Delete</span>
                </div>
              </CustomMenu.MenuItem>
            )}
          </CustomMenu>
        </div>
      )}
    </div>
  );
});
