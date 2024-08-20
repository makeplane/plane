import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { TIssueAdditionalPropertiesActivityItem } from "@/plane-web/components/issues";
// plane web hooks
import { useIssuePropertiesActivity, useIssueProperty } from "@/plane-web/hooks/store";

export const IssueDropdownPropertyActivity: FC<TIssueAdditionalPropertiesActivityItem> = observer((props) => {
  const { activityId, issueTypeId, issuePropertyId } = props;
  // plane web hooks
  const { getPropertyActivityById } = useIssuePropertiesActivity();
  const issueProperty = useIssueProperty(issueTypeId, issuePropertyId);
  // derived values
  const activityDetail = getPropertyActivityById(activityId);
  const propertyDetail = useIssueProperty(issueTypeId, issuePropertyId);
  const propertyName = propertyDetail?.display_name?.toLowerCase();

  if (!activityDetail) return <></>;
  return (
    <>
      {activityDetail.action === "created" && activityDetail.new_value ? (
        <>
          added{" "}
          <span className="font-medium text-custom-text-100">
            {issueProperty?.getPropertyOptionById(activityDetail?.new_value)?.name}
          </span>{" "}
          to {propertyName}.
        </>
      ) : (
        activityDetail.action === "deleted" &&
        activityDetail.old_value && (
          <>
            removed{" "}
            <span className="font-medium text-custom-text-100">
              {issueProperty?.getPropertyOptionById(activityDetail?.old_value)?.name}
            </span>{" "}
            from {propertyName}.
          </>
        )
      )}
      {activityDetail.action === "updated" && activityDetail.old_value && activityDetail.new_value && (
        <>
          updated {propertyName} from{" "}
          <span className="font-medium text-custom-text-100">
            {issueProperty?.getPropertyOptionById(activityDetail?.old_value)?.name}
          </span>{" "}
          to{" "}
          <span className="font-medium text-custom-text-100">
            {issueProperty?.getPropertyOptionById(activityDetail?.new_value)?.name}.
          </span>
        </>
      )}
    </>
  );
});
