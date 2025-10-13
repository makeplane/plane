import { FC } from "react";
import { observer } from "mobx-react";
import { Settings } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { usePlatformOS } from "@/hooks/use-platform-os";
// components
import { IssueActivityBlockComponent, IssueLink } from "./";

type TIssueDynamicPropertyActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssueDynamicPropertyActivity: FC<TIssueDynamicPropertyActivity> = observer((props) => {
  const { activityId, showIssue = true, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();
  const { isMobile } = usePlatformOS();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;

  // 判断是设置新值还是修改值
  const isSet = !activity.old_value || activity.old_value === "";
  const actionText = isSet ? "set" : "changed";

  // 获取字段名称
  const fieldName = activity.field || "dynamic property";

  return (
    <IssueActivityBlockComponent
      icon={<Settings size={14} className="text-custom-text-200" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {actionText} {fieldName}
        {!isSet && (
          <>
            {" "}
            from{" "}
            <Tooltip tooltipContent={`"${activity.old_value}"`}>
              <span className="font-medium text-custom-text-100 inline-block max-w-32 truncate align-bottom">
                "{activity.old_value}"
              </span>
            </Tooltip>
          </>
        )}{" "}
        to{" "}
        <Tooltip tooltipContent={`"${activity.new_value}"`}>
          <span className="font-medium text-custom-text-100 inline-block max-w-32 truncate align-bottom">
            "{activity.new_value}"
          </span>
        </Tooltip>
        {showIssue ? ` for ` : ``}
        {showIssue && <IssueLink activityId={activityId} />}.
      </>
    </IssueActivityBlockComponent>
  );
});
