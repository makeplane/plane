import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { useIssueDetail } from "@/hooks/store";
// plane web components
import { IssueActivityBlockComponent } from "@/plane-web/components/issues";
// plane web hooks
import { getWorkItemCustomPropertyActivityMessage } from "@/plane-web/helpers/work-item-custom-property-activity";
import { useIssuePropertiesActivity, useIssueTypes } from "@/plane-web/hooks/store";
// plane types

type TIssueAdditionalPropertiesActivity = {
  activityId: string;
  ends: "top" | "bottom" | undefined;
};

export type TIssueAdditionalPropertiesActivityItem = {
  activityId: string;
  customPropertyId: string;
};

export const IssueAdditionalPropertiesActivity: FC<TIssueAdditionalPropertiesActivity> = observer((props) => {
  const { activityId, ends } = props;
  // hooks and derived values
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getIssuePropertyById } = useIssueTypes();
  const { getPropertyActivityById } = useIssuePropertiesActivity();
  // activity details
  const activityDetail = getPropertyActivityById(activityId);
  if (!activityDetail || !activityDetail.issue || !activityDetail.property) return <></>;
  // issue details
  const issueDetail = getIssueById(activityDetail?.issue);
  if (!issueDetail) return <></>;
  // property details
  const propertyDetail = getIssuePropertyById(activityDetail?.property);
  if (!propertyDetail?.id) return <></>;
  // activity message
  const activityMessage = getWorkItemCustomPropertyActivityMessage({
    action: activityDetail.action,
    newValue: activityDetail.new_value,
    oldValue: activityDetail.old_value,
    propertyDetail,
    workspaceId: activityDetail.workspace,
  });

  if (!activityMessage) return <></>;

  return (
    <IssueActivityBlockComponent activityId={activityId} propertyId={propertyDetail.id} ends={ends}>
      {activityMessage}
    </IssueActivityBlockComponent>
  );
});
