import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { useIssueDetail } from "hooks/store";
// components
import { IssueActivityBlockComponent } from "./";
// icons
import { LayersIcon } from "@plane/ui";

type TIssueDefaultActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssueDefaultActivity: FC<TIssueDefaultActivity> = observer((props) => {
  const { activityId, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      activityId={activityId}
      icon={<LayersIcon width={12} height={12} color="#6b7280" aria-hidden="true" />}
      ends={ends}
    >
      <>{activity.verb === "created" ? " created the issue." : " deleted an issue."}</>
    </IssueActivityBlockComponent>
  );
});
