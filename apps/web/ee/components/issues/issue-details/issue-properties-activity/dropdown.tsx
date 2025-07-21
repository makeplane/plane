import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { TIssueAdditionalPropertiesActivityItem } from "@/plane-web/components/issues";
// plane web hooks
import { useIssuePropertiesActivity, useIssueTypes } from "@/plane-web/hooks/store";

export const IssueDropdownPropertyActivity: FC<TIssueAdditionalPropertiesActivityItem> = observer((props) => {
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
      {activityDetail.action === "created" && activityDetail.new_value ? (
        <>
          selected{" "}
          <span className="font-medium text-custom-text-100">
            {propertyDetail?.getPropertyOptionById(activityDetail?.new_value)?.name}
          </span>{" "}
          as value(s) for <span className="font-medium text-custom-text-100">{propertyName}</span>.
        </>
      ) : (
        activityDetail.action === "deleted" &&
        activityDetail.old_value && (
          <>
            deselected{" "}
            <span className="font-medium text-custom-text-100">
              {propertyDetail?.getPropertyOptionById(activityDetail?.old_value)?.name}
            </span>{" "}
            from the previous selection in <span className="font-medium text-custom-text-100">{propertyName}</span>.
          </>
        )
      )}
      {activityDetail.action === "updated" && activityDetail.old_value && activityDetail.new_value && (
        <>
          changed{" "}
          <span className="font-medium text-custom-text-100">
            {propertyDetail?.getPropertyOptionById(activityDetail?.old_value)?.name}
          </span>{" "}
          to{" "}
          <span className="font-medium text-custom-text-100">
            {propertyDetail?.getPropertyOptionById(activityDetail?.new_value)?.name}
          </span>{" "}
          in <span className="font-medium text-custom-text-100">{propertyName}</span>.
        </>
      )}
    </>
  );
});
