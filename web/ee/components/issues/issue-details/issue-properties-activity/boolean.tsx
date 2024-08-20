import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { TIssueAdditionalPropertiesActivityItem } from "@/plane-web/components/issues";
// plane web hooks
import { useIssuePropertiesActivity, useIssueProperty } from "@/plane-web/hooks/store";

export const IssueBooleanPropertyActivity: FC<TIssueAdditionalPropertiesActivityItem> = observer((props) => {
  const { activityId, issueTypeId, issuePropertyId } = props;
  // plane web hooks
  const { getPropertyActivityById } = useIssuePropertiesActivity();
  // derived values
  const activityDetail = getPropertyActivityById(activityId);
  const propertyDetail = useIssueProperty(issueTypeId, issuePropertyId);
  const propertyName = propertyDetail?.display_name?.toLowerCase();

  if (!activityDetail) return <></>;
  return (
    <>
      {activityDetail.new_value && (
        <>
          {activityDetail.action === "created" ? "set" : "updated"} {propertyName} to{" "}
          <span className="font-medium text-custom-text-100">
            {activityDetail?.new_value === "true" ? "True" : "False"}.
          </span>
        </>
      )}
    </>
  );
});
