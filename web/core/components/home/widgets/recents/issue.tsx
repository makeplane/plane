import { TRecentActivityWidgetResponse } from "@plane/types";
import { PriorityIcon } from "@plane/ui";
import { ListItem } from "@/components/core/list";
import { calculateTimeAgo } from "@/helpers/date-time.helper";
import { useIssueDetail } from "@/hooks/store";
import { IssueIdentifier } from "@/plane-web/components/issues";

type BlockProps = {
  activity: TRecentActivityWidgetResponse;
  ref: React.RefObject<HTMLDivElement>;
};
export const RecentIssue = (props: BlockProps) => {
  const { activity, ref } = props;
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  console.log({ ...activity.issue_detail, ...activity }, { ...getIssueById(activity?.issue) });

  if (!activity?.issue) return <></>;
  const issueDetails = getIssueById(activity?.issue);
  return (
    <ListItem
      key={activity.id}
      itemLink=""
      title={""}
      prependTitleElement={
        <div className="flex flex-shrink-0 items-center justify-center rounded-md gap-4 ">
          <IssueIdentifier
            issueTypeId={activity.issue_detail?.type_id}
            projectId={activity?.project || ""}
            projectIdentifier={activity.project_detail?.identifier || ""}
            issueSequenceId={activity.issue_detail?.sequence_id || ""}
            textContainerClassName="text-custom-sidebar-text-400 text-sm whitespace-nowrap"
          />
          <div className="text-custom-text-200 font-medium text-sm whitespace-nowrap">
            {activity.issue_detail?.name}
          </div>
          <div className="font-semibold text-xs text-custom-text-400">{calculateTimeAgo(activity.updated_at)}</div>
        </div>
      }
      quickActionElement={
        <div>
          <PriorityIcon priority={activity.issue_detail?.priority} withContainer size={12} />
          <div className="h-5">
            {/* <MemberDropdown
              projectId={activity?.project}
              value={activity?.assignee_ids}
              onChange={handleAssignee}
              disabled
              multiple
              buttonVariant={activity.assignee_ids?.length > 0 ? "transparent-without-text" : "border-without-text"}
              buttonClassName={activity.assignee_ids?.length > 0 ? "hover:bg-transparent px-0" : ""}
              showTooltip={activity?.assignee_ids?.length === 0}
              placeholder="Assignees"
              optionsClassName="z-10"
              tooltipContent=""
              renderByDefault={isMobile}
            /> */}
          </div>
        </div>
      }
      parentRef={ref}
      disableLink={false}
      className="bg-transparent my-auto !px-2 border-custom-border-200/40 py-3"
      itemClassName="my-auto"
    />
  );
};
