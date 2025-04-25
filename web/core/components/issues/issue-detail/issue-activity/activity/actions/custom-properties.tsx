"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { useIssueDetail } from "@/hooks/store";
// components
import { IssueActivityBlockComponent, IssueLink } from "./";
// icons
import { DoubleCircleIcon } from "@plane/ui";
import { useTranslation } from "@plane/i18n";

type TIssueCustomPropertyActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssueCustomPropertyActivity: FC<TIssueCustomPropertyActivity> = observer((props) => {
  const { activityId, showIssue = true, ends } = props;
  const { t } = useTranslation();
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;

  const isNewProperty = !activity.old_value;
  const customPropertyKey = activity?.field?.replace("Custom Property ", "");
  const newValue = activity.new_value;
  const oldValue = activity.old_value;

  return (
    <IssueActivityBlockComponent
      icon={<DoubleCircleIcon className="h-4 w-4 flex-shrink-0 text-custom-text-200" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {isNewProperty ? (
          <>{t("added_custom_property")} <span className="font-medium text-custom-text-100">{customPropertyKey}</span> {t("with_value")} <span className="font-medium text-custom-text-100">{newValue}</span>.</>
        ) : (
          <>{t("updated_custom_property_value")} <span className="font-medium text-custom-text-100">{customPropertyKey}</span> from <span className="font-medium text-custom-text-100">{oldValue}</span> to <span className="font-medium text-custom-text-100">{newValue}</span>.</>
        )}
      </>
    </IssueActivityBlockComponent>
  );
});
