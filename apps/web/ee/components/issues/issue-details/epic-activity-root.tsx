import { FC } from "react";

import { observer } from "mobx-react";
import { ArrowRightLeft } from "lucide-react";
import { EpicIcon } from "@plane/propel/icons";
import { TIssueActivity } from "@plane/types";
import { IssueActivityBlockComponent } from "@/components/issues/issue-detail/issue-activity/activity/actions";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type TEpicActivityProps = {
  activityId: string;
  ends: "top" | "bottom" | undefined;
};

const commonIconClassName = "h-3 w-3 flex-shrink-0 text-custom-text-300";

export const EpicActivity: FC<TEpicActivityProps> = observer((props) => {
  const { activityId, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  const getEpicActivityIcon = (activity: TIssueActivity) => {
    switch (activity.verb) {
      case "converted":
        return <ArrowRightLeft className={commonIconClassName} />;
      default:
        return <EpicIcon className={commonIconClassName} />;
    }
  };

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent icon={getEpicActivityIcon(activity)} activityId={activityId} ends={ends}>
      <>
        {activity.verb === "created" ? (
          <>created the epic.</>
        ) : (
          <>
            converted{" "}
            <span className="text-custom-text-100 font-medium">{`${activity?.project_detail?.identifier}-${activity?.issue_detail?.sequence_id}`}</span>{" "}
            to work item.
          </>
        )}
      </>
    </IssueActivityBlockComponent>
  );
});
