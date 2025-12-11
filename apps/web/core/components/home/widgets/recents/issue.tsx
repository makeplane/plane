import { observer } from "mobx-react";
// plane types
import { PriorityIcon, StateGroupIcon, WorkItemsIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TActivityEntityData, TIssueEntityData } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// plane ui
import { calculateTimeAgo, generateWorkItemLink } from "@plane/utils";
// components
import { ListItem } from "@/components/core/list";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
// helpers
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";

type BlockProps = {
  activity: TActivityEntityData;
  ref: React.RefObject<HTMLDivElement>;
  workspaceSlug: string;
};
export const RecentIssue = observer(function RecentIssue(props: BlockProps) {
  const { activity, ref, workspaceSlug } = props;
  // hooks
  const { getStateById } = useProjectState();
  const { setPeekIssue } = useIssueDetail();
  const { setPeekIssue: setPeekEpic } = useIssueDetail(EIssueServiceType.EPICS);
  const { getProjectIdentifierById } = useProject();
  // derived values
  const issueDetails: TIssueEntityData = activity.entity_data as TIssueEntityData;
  const projectIdentifier = getProjectIdentifierById(issueDetails?.project_id);

  if (!issueDetails) return <></>;

  const state = getStateById(issueDetails?.state);

  const workItemLink = generateWorkItemLink({
    workspaceSlug: workspaceSlug?.toString(),
    projectId: issueDetails?.project_id,
    issueId: issueDetails?.id,
    projectIdentifier,
    sequenceId: issueDetails?.sequence_id,
    isEpic: issueDetails?.is_epic,
  });

  const handlePeekOverview = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const peekDetails = {
      workspaceSlug,
      projectId: issueDetails?.project_id,
      issueId: activity.entity_data.id,
    };
    if (issueDetails?.is_epic) setPeekEpic(peekDetails);
    else setPeekIssue(peekDetails);
  };

  return (
    <ListItem
      key={activity.id}
      id={`issue-${issueDetails?.id}`}
      itemLink={workItemLink}
      title={issueDetails?.name}
      prependTitleElement={
        <div className="flex-shrink-0 flex items-center gap-2">
          {issueDetails.type ? (
            <IssueIdentifier
              size="lg"
              issueTypeId={issueDetails?.type}
              projectId={issueDetails?.project_id || ""}
              projectIdentifier={issueDetails?.project_identifier || ""}
              issueSequenceId={issueDetails?.sequence_id || ""}
              variant="tertiary"
            />
          ) : (
            <div className="flex gap-2 items-center justify-center">
              <div className="flex-shrink-0 grid place-items-center rounded-sm bg-layer-2 size-8">
                <WorkItemsIcon className="size-4 text-tertiary" />
              </div>
              <div className="font-medium text-placeholder text-13 whitespace-nowrap">
                {issueDetails?.project_identifier}-{issueDetails?.sequence_id}
              </div>
            </div>
          )}
        </div>
      }
      appendTitleElement={
        <div className="flex-shrink-0 font-medium text-11 text-placeholder">
          {calculateTimeAgo(activity.visited_at)}
        </div>
      }
      quickActionElement={
        <div className="flex gap-4">
          <Tooltip tooltipHeading="State" tooltipContent={state?.name ?? "State"}>
            <div>
              <StateGroupIcon
                stateGroup={state?.group ?? "backlog"}
                color={state?.color}
                className="h-4 w-4 my-auto"
                percentage={state?.order}
              />
            </div>
          </Tooltip>
          <Tooltip tooltipHeading="Priority" tooltipContent={issueDetails?.priority ?? "Priority"}>
            <div>
              <PriorityIcon priority={issueDetails?.priority} withContainer size={12} />
            </div>
          </Tooltip>
          {issueDetails?.assignees?.length > 0 && (
            <div className="h-5">
              <MemberDropdown
                projectId={issueDetails?.project_id}
                value={issueDetails?.assignees}
                onChange={() => {}}
                disabled
                multiple
                buttonVariant={issueDetails?.assignees?.length > 0 ? "transparent-without-text" : "border-without-text"}
                buttonClassName={issueDetails?.assignees?.length > 0 ? "hover:bg-transparent px-0" : ""}
                showTooltip={issueDetails?.assignees?.length === 0}
                placeholder="Assignees"
                optionsClassName="z-10"
                tooltipContent=""
              />
            </div>
          )}
        </div>
      }
      parentRef={ref}
      disableLink={false}
      className="my-auto !px-2 border-none py-3"
      itemClassName="my-auto"
      onItemClick={handlePeekOverview}
      preventDefaultProgress
    />
  );
});
