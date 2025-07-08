import { FC } from "react";
import { observer } from "mobx-react";
import { ArrowRightLeft } from "lucide-react";
// components
import { IssueActivityBlockComponent } from "@/components/issues/issue-detail/issue-activity/activity/actions";
// hooks
import { useIssueDetail } from "@/hooks/store";

type TWorkItemConvertActivity = {
  activityId: string;
  showIssue?: boolean;
  ends: "top" | "bottom" | undefined;
};

export const WorkItemConvertActivity: FC<TWorkItemConvertActivity> = observer((props) => {
  const { activityId, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={<ArrowRightLeft className="h-3 w-3 flex-shrink-0 text-custom-text-300" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        converted{" "}
        <span className="text-custom-text-100 font-medium">{`${activity?.project_detail?.identifier}-${activity?.issue_detail?.sequence_id}`}</span>{" "}
        to epic.
      </>
    </IssueActivityBlockComponent>
  );
});
