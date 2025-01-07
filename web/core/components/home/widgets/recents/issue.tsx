import { TActivityEntityData, TIssueEntityData } from "@plane/types";
import { LayersIcon, PriorityIcon, StateGroupIcon, Tooltip } from "@plane/ui";
import { ListItem } from "@/components/core/list";
import { MemberDropdown } from "@/components/dropdowns";
import { calculateTimeAgo } from "@/helpers/date-time.helper";
import { useIssueDetail, useProjectState } from "@/hooks/store";
import { IssueIdentifier } from "@/plane-web/components/issues";

type BlockProps = {
  activity: TActivityEntityData;
  ref: React.RefObject<HTMLDivElement>;
  workspaceSlug: string;
};
export const RecentIssue = (props: BlockProps) => {
  const { activity, ref, workspaceSlug } = props;
  // hooks
  const { getStateById } = useProjectState();
  const { setPeekIssue } = useIssueDetail();
  // derived values
  const issueDetails: TIssueEntityData = activity.entity_data as TIssueEntityData;
  const state = getStateById(issueDetails?.state);

  return (
    <ListItem
      key={activity.id}
      itemLink=""
      title={""}
      prependTitleElement={
        <div className="flex flex-shrink-0 items-center justify-center rounded-md gap-4 ">
          {issueDetails.type ? (
            <IssueIdentifier
              size="lg"
              issueTypeId={issueDetails?.type}
              projectId={issueDetails?.project_id || ""}
              projectIdentifier={issueDetails?.project_identifier || ""}
              issueSequenceId={issueDetails?.sequence_id || ""}
              textContainerClassName="text-custom-sidebar-text-400 text-sm whitespace-nowrap"
            />
          ) : (
            <div className="flex gap-2 items-center justify-center">
              <div className="flex flex-shrink-0 items-center justify-center rounded gap-4 bg-custom-background-80 w-[25.5px] h-[25.5px]">
                <LayersIcon className="w-4 h-4 text-custom-text-350" />
              </div>
              <div className="font-medium text-custom-sidebar-text-400 text-sm whitespace-nowrap">
                {issueDetails?.project_identifier}-{issueDetails?.sequence_id}
              </div>
            </div>
          )}
          <div className="text-custom-text-200 font-medium text-sm whitespace-nowrap">{issueDetails?.name}</div>
          <div className="font-medium text-xs text-custom-text-400">{calculateTimeAgo(activity.visited_at)}</div>
        </div>
      }
      quickActionElement={
        <div className="flex gap-4">
          <Tooltip tooltipHeading="State" tooltipContent={state?.name ?? "State"}>
            <div>
              <StateGroupIcon stateGroup={state?.group ?? "backlog"} color={state?.color} className="h-4 w-4 my-auto" />
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
      className="bg-transparent my-auto !px-2 border-none py-3"
      itemClassName="my-auto"
      onItemClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setPeekIssue({ workspaceSlug, projectId: issueDetails?.project_id, issueId: activity.entity_data.id });
      }}
    />
  );
};
