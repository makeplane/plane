import uniq from "lodash/uniq";
import { observer } from "mobx-react";
import { CircleMinus, PencilIcon } from "lucide-react";
// plane imports
import { EWorkItemTypeEntity, IIssueType, IState, IUserLite, TWorkItemBlueprintFormData } from "@plane/types";
import { Avatar, AvatarGroup, CustomMenu, PriorityIcon, StateGroupIcon } from "@plane/ui";
import { cn, getFileURL, TProjectBlueprintDetails } from "@plane/utils";
// plane web imports
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";
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

export const WorkItemBlueprintListItem: React.FC<TWorkItemBlueprintListItemProps> = observer((props) => {
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
      className={cn(
        "group relative flex min-h-10 h-full w-full items-center gap-3 px-1.5 py-1 transition-all rounded",
        {
          "hover:bg-custom-background-90 cursor-pointer": allowEdit,
          "cursor-not-allowed": !allowEdit,
        }
      )}
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
            textContainerClassName="text-xs text-custom-text-200"
          />
        </div>
      )}
      <div className="flex w-full truncate items-center gap-3">
        <span className="w-full truncate text-sm text-custom-text-100">{workItem.name}</span>
      </div>
      <div className={cn("flex items-center gap-3.5 flex-shrink-0 text-sm", !allowEdit && "opacity-60")}>
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
        <div className="flex-shrink-0 text-sm">
          <CustomMenu placement="bottom-end" ellipsis>
            {handleEdit && (
              <CustomMenu.MenuItem onClick={handleEdit}>
                <div className="flex items-center gap-2">
                  <PencilIcon className="h-3.5 w-3.5" strokeWidth={2} />
                  <span>Edit</span>
                </div>
              </CustomMenu.MenuItem>
            )}
            {handleDelete && (
              <CustomMenu.MenuItem onClick={handleDelete}>
                <div className="flex items-center gap-2 text-red-500">
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
