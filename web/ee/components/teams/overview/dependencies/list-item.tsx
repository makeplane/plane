import { useCallback, useMemo, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EDependencyType } from "@plane/constants";
import { TTeamDependencyIssue } from "@plane/types";
import { Avatar, AvatarGroup, PriorityIcon, StateGroupIcon, Tooltip } from "@plane/ui";
import { cn, getFileURL } from "@plane/utils";
// components
import { ListItem } from "@/components/core/list/list-item";
// hooks
import { useIssueDetail, useMember, useProject } from "@/hooks/store";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues";

type TTeamDependencyIssueListItemProps = {
  type: EDependencyType;
  issue: TTeamDependencyIssue;
};

export const TeamDependencyIssueListItem = observer((props: TTeamDependencyIssueListItemProps) => {
  const { type, issue } = props;
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // refs
  const parentRef = useRef(null);
  // store hooks
  const { getUserDetails } = useMember();
  const { getProjectIdentifierById } = useProject();
  const { getIsIssuePeeked, setPeekIssue } = useIssueDetail();
  // derived values
  const projectIdentifier = getProjectIdentifierById(issue.project_id);
  // helpers
  const getAssigneeDetails = useCallback(
    (userIds: string[]) =>
      userIds
        .map((userId) => {
          const userDetails = getUserDetails(userId);
          if (!userDetails) return;
          return userDetails.first_name ?? userDetails.display_name;
        })
        .join(", ")
        .trim(),
    [getUserDetails]
  );
  const handleIssuePeekOverview = useCallback(
    () =>
      workspaceSlug &&
      issue &&
      issue.project_id &&
      issue.id &&
      !getIsIssuePeeked(issue.id) &&
      setPeekIssue({
        workspaceSlug,
        projectId: issue.project_id,
        issueId: issue.id,
        isArchived: !!issue.archived_at,
      }),
    [getIsIssuePeeked, issue, setPeekIssue, workspaceSlug]
  );

  const dependencyDetails = useMemo(() => {
    if (issue.assignee_ids?.length === 0) return;
    switch (type) {
      case "blocking": {
        if (issue.assignee_ids?.length === 1) return `${getAssigneeDetails([issue.assignee_ids?.[0]])} is blocking you`;
        else {
          return (
            <span>
              {getAssigneeDetails([issue.assignee_ids?.[0]])} and{" "}
              <Tooltip tooltipContent={getAssigneeDetails(issue.assignee_ids?.slice(1))}>
                <span className="hover:underline cursor-help">{issue.assignee_ids?.length - 1} other(s)</span>
              </Tooltip>{" "}
              are blocking you
            </span>
          );
        }
      }
      case "blocked_by": {
        if (issue.assignee_ids?.length === 1)
          return `You are blocking ${getAssigneeDetails([issue.assignee_ids?.[0]])}`;
        else {
          return (
            <span>
              You are blocking {getAssigneeDetails([issue.assignee_ids?.[0]])} and{" "}
              <Tooltip tooltipContent={getAssigneeDetails(issue.assignee_ids?.slice(1))}>
                <span className="hover:underline cursor-help">{issue.assignee_ids?.length - 1} other(s)</span>
              </Tooltip>
            </span>
          );
        }
      }
      default:
        return;
    }
  }, [issue.assignee_ids, type, getAssigneeDetails]);

  return (
    <div
      id={`issue-${issue.id}`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        handleIssuePeekOverview();
      }}
      className="w-full cursor-pointer"
    >
      <ListItem
        title={issue.name}
        itemLink="#"
        prependTitleElement={
          <div className="flex flex-shrink-0 items-center justify-center gap-4">
            <PriorityIcon priority={issue.priority} className="size-3.5 flex-shrink-0" />
            <StateGroupIcon stateGroup={issue.state__group} className="size-3.5 flex-shrink-0" />
            {issue && issue.project_id && projectIdentifier && (
              <IssueIdentifier
                size="xs"
                issueSequenceId={issue.sequence_id}
                issueTypeId={issue.type_id}
                projectId={issue.project_id}
                projectIdentifier={projectIdentifier}
                textContainerClassName="text-xs"
              />
            )}
          </div>
        }
        quickActionElement={
          <div className="flex flex-shrink-0 items-center justify-center gap-2">
            <AvatarGroup size="md" showTooltip>
              {issue.assignee_ids?.map((userId: string) => {
                const userDetails = getUserDetails(userId);
                if (!userDetails) return;
                return <Avatar key={userId} src={getFileURL(userDetails.avatar_url)} name={userDetails.display_name} />;
              })}
            </AvatarGroup>
            <div className="text-red-500 font-medium text-sm">{dependencyDetails}</div>
          </div>
        }
        parentRef={parentRef}
        className={cn(
          "min-h-9 rounded",
          getIsIssuePeeked(issue.id) ? "border border-custom-primary-70" : "border-none"
        )}
        disableLink
      />
    </div>
  );
});
