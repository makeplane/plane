import { FC } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useIssueDetail } from "hooks/store";
// components
import { IssueActivityList } from "./activity-list";

type TIssueActivityRoot = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const IssueActivityRoot: FC<TIssueActivityRoot> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled } = props;
  // hooks
  const {
    activity: { getActivitiesByIssueId },
  } = useIssueDetail();

  const activityIds = getActivitiesByIssueId(issueId);

  if (!activityIds) return <></>;
  return (
    <div>
      {activityIds.map((activityId, index) => (
        <IssueActivityList
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          activityId={activityId}
          disabled={disabled}
          ends={index === 0 ? "top" : index === activityIds.length - 1 ? "bottom" : undefined}
        />
      ))}
    </div>
  );
});
