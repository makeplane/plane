import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { TIssueAdditionalPropertiesActivityItem } from "@/plane-web/components/issues";
// plane web hooks
import { useIssuePropertiesActivity, useIssueTypes } from "@/plane-web/hooks/store";

export const IssueTextPropertyActivity: FC<TIssueAdditionalPropertiesActivityItem> = observer((props) => {
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
      {activityDetail.new_value ? (
        <>
          {activityDetail.action === "created" ? "set " : "changed "}
          <span className="font-medium text-custom-text-100">{propertyName}</span> to{" "}
          <span className="font-medium text-custom-text-100">{`"${activityDetail?.new_value}"`}.</span>
        </>
      ) : (
        <>
          cleared the previous text in <span className="font-medium text-custom-text-100">{propertyName}</span>.
        </>
      )}
    </>
  );
});
