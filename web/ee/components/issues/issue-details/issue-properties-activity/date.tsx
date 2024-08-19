import { FC } from "react";
import { observer } from "mobx-react";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
// plane web components
import { TIssueAdditionalPropertiesActivityItem } from "@/plane-web/components/issues";
// plane web hooks
import { useIssuePropertiesActivity, useIssueProperty } from "@/plane-web/hooks/store";

export const IssueDatePropertyActivity: FC<TIssueAdditionalPropertiesActivityItem> = observer((props) => {
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
      {activityDetail.action === "created" && (
        <>
          set the {propertyName} to{" "}
          <span className="font-medium text-custom-text-100">{renderFormattedDate(activityDetail.new_value)}.</span>
        </>
      )}
      {activityDetail.action === "updated" && (
        <>
          updated the {propertyName} from{" "}
          <span className="font-medium text-custom-text-100">{renderFormattedDate(activityDetail.old_value)}</span> to{" "}
          <span className="font-medium text-custom-text-100">{renderFormattedDate(activityDetail.new_value)}.</span>{" "}
        </>
      )}
      {activityDetail.action === "deleted" && <>removed the {propertyName}.</>}
    </>
  );
});
