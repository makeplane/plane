import { FC } from "react";
// components
import { TAdditionalActivityRoot } from "@/ce/components/issues/issue-details/additional-activity-root";
import { CustomerActivity, CustomerRequestActivity } from "@/plane-web/components/issues/issue-details";

export const AdditionalActivityRoot: FC<TAdditionalActivityRoot> = (props) => {
  const { field, activityId, ends } = props;

  switch (field) {
    case "customer":
      return <CustomerActivity activityId={activityId} ends={ends} />;
    case "customer_request":
      return <CustomerRequestActivity activityId={activityId} ends={ends} />;
    default:
      return <></>;
  }
};
