import { FC } from "react";
// hooks
import { useIssueDetail } from "hooks/store";
// ui
import { Tooltip } from "@plane/ui";

type TIssueLink = {
  activityId: string;
};

export const IssueLink: FC<TIssueLink> = (props) => {
  const { activityId } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  return (
    <Tooltip tooltipContent={activity.issue_detail ? activity.issue_detail.name : "This issue has been deleted"}>
      <a
        aria-disabled={activity.issue === null}
        href={`${
          activity.issue_detail
            ? `/${activity.workspace_detail?.slug}/projects/${activity.project}/issues/${activity.issue}`
            : "#"
        }`}
        target={activity.issue === null ? "_self" : "_blank"}
        rel={activity.issue === null ? "" : "noopener noreferrer"}
        className="inline-flex items-center gap-1 font-medium text-custom-text-100 hover:underline"
      >
        {activity.issue_detail ? `${activity.project_detail.identifier}-${activity.issue_detail.sequence_id}` : "Issue"}{" "}
        <span className="font-normal">{activity.issue_detail?.name}</span>
      </a>
    </Tooltip>
  );
};
