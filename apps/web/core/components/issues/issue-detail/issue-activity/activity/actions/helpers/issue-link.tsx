import { Tooltip } from "@plane/propel/tooltip";
import { generateWorkItemLink } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TIssueLink = {
  activityId: string;
};

export function IssueLink(props: TIssueLink) {
  const { activityId } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();
  const { isMobile } = usePlatformOS();
  const activity = getActivityById(activityId);

  if (!activity) return <></>;

  const workItemLink = generateWorkItemLink({
    workspaceSlug: activity.workspace_detail?.slug,
    projectId: activity.project,
    issueId: activity.issue,
    projectIdentifier: activity.project_detail.identifier,
    sequenceId: activity.issue_detail.sequence_id,
  });
  return (
    <Tooltip
      tooltipContent={activity.issue_detail ? activity.issue_detail.name : "This work item has been deleted"}
      isMobile={isMobile}
    >
      <a
        aria-disabled={activity.issue === null}
        href={`${activity.issue_detail ? workItemLink : "#"}`}
        target={activity.issue === null ? "_self" : "_blank"}
        rel={activity.issue === null ? "" : "noopener noreferrer"}
        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
      >
        {activity.issue_detail
          ? `${activity.project_detail.identifier}-${activity.issue_detail.sequence_id}`
          : "Work items"}{" "}
        <span className="font-regular">{activity.issue_detail?.name}</span>
      </a>
    </Tooltip>
  );
}
