import { FC } from "react";
// components
import { TAdditionalActivityRoot } from "@/ce/components/issues/issue-details/additional-activity-root";

import { CustomerActivity, CustomerRequestActivity } from "@/plane-web/components/issues/issue-details";
import { WorkItemConvertActivity } from "./convert";
import { EpicActivity } from "./epic-activity-root";
import { IssueEstimateTimeActivity } from "./estimate-time-activity";

export const AdditionalActivityRoot: FC<TAdditionalActivityRoot> = (props) => {
  const { field, activityId, ends } = props;

  switch (field) {
    case "estimate_time":
      return <IssueEstimateTimeActivity activityId={activityId} ends={ends} showIssue={false} />;
    case "customer":
      return <CustomerActivity activityId={activityId} ends={ends} />;
    case "customer_request":
      return <CustomerRequestActivity activityId={activityId} ends={ends} />;
    case "work_item":
      return <WorkItemConvertActivity activityId={activityId} ends={ends} />;
    case "epic":
      return <EpicActivity activityId={activityId} ends={ends} />;
    default:
      return <></>;
  }
};
