import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { TIssueAdditionalPropertiesActivityItem } from "@/plane-web/components/issues";
// plane web hooks
import { useIssuePropertiesActivity, useIssueTypes } from "@/plane-web/hooks/store";

export const IssueNumberPropertyActivity: FC<TIssueAdditionalPropertiesActivityItem> = observer((props) => {
  const { activityId, customPropertyId } = props;
  // plane web hooks
  const { getIssuePropertyById } = useIssueTypes();
  const { getPropertyActivityById } = useIssuePropertiesActivity();
  // derived values
  const activityDetail = getPropertyActivityById(activityId);
  const propertyDetail = getIssuePropertyById(customPropertyId);
  const propertyName = propertyDetail?.display_name;

  if (!activityDetail) return <></>;
  return (
    <>
      {activityDetail.action === "created" && (
        <>
          set <span className="font-medium text-custom-text-100">{propertyName}</span> to{" "}
          <span className="font-medium text-custom-text-100">{activityDetail?.new_value}.</span>
        </>
      )}
      {activityDetail.action === "updated" && (
        <>
          changed <span className="font-medium text-custom-text-100">{activityDetail?.old_value}</span> to{" "}
          <span className="font-medium text-custom-text-100">{activityDetail?.new_value}</span> in{" "}
          <span className="font-medium text-custom-text-100">{propertyName}</span>.
        </>
      )}
      {activityDetail.action === "deleted" && (
        <>
          removed <span className="font-medium text-custom-text-100">{activityDetail?.old_value}</span> from{" "}
          <span className="font-medium text-custom-text-100">{propertyName}</span>.
        </>
      )}
    </>
  );
});
