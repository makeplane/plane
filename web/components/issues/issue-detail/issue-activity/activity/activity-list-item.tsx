import { FC } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useIssueDetail } from "hooks/store";

type TIssueActivityListItem = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityId: string;
  disabled: boolean;
};

export const IssueActivityCard: FC<any> = (props) => {
  const {} = props;

  return (
    <div className="border border-red-500">
      <div>
        <div>Icon</div>
        <div>Content</div>
      </div>
      <div />
    </div>
  );
};

export const IssueActivityListItem: FC<TIssueActivityListItem> = observer((props) => {
  const { workspaceSlug, projectId, issueId, activityId, disabled } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activityFiled = getActivityById(activityId)?.field;

  console.log("activityFiled", activityFiled);

  switch (activityFiled) {
    case activityFiled:
      return <div>{activityFiled}</div>;
    default:
      return <></>;
  }
});
