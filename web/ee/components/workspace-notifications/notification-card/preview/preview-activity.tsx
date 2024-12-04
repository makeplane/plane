import { FC } from "react";
import { Network } from "lucide-react";
import { IUserLite, TNotification } from "@plane/types";
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { sanitizeCommentForNotification } from "@/helpers/notification.helper";
import { replaceUnderscoreIfSnakeCase, stripAndTruncateHTML } from "@/helpers/string.helper";
import { IssueActivityBlock } from "./acitvity-block";
import { cn } from "@/helpers/common.helper";

export type TNotificationPreviewActivity = {
  notification: TNotification;
  ends: "top" | "bottom" | undefined;
  workspaceSlug: string;
};
export const NotificationPreviewActivity: FC<TNotificationPreviewActivity> = (props) => {
  const { notification, workspaceSlug, ends } = props;
  const notificationField = notification?.data?.issue_activity.field || undefined;
  const notificationTriggeredBy = notification.triggered_by_details || undefined;
  const triggeredBy = notification.triggered_by_details;

  if (!workspaceSlug || !notification.id || !notification?.id || !notificationField) return <></>;

  return (
    <div className={cn("flex gap-2 items-center", ends === "bottom" ? "pb-3" : "")}>
      <IssueActivityBlock
        ends={ends}
        notificationField={notificationField}
        createdAt={notification?.created_at}
        triggeredBy={triggeredBy}
      >
        <div className="w-full whitespace-normal text-sm text-custom-text-100">
          {!notification.message ? (
            <>
              <span className="font-semibold">
                {notificationTriggeredBy?.is_bot
                  ? notificationTriggeredBy?.first_name
                  : notificationTriggeredBy?.display_name}{" "}
              </span>
              {!["comment", "archived_at"].includes(notificationField) && notification?.data?.issue_activity.verb}{" "}
              {notificationField === "comment"
                ? "commented"
                : notificationField === "archived_at"
                  ? notification?.data?.issue_activity.new_value === "restore"
                    ? "restored the issue"
                    : "archived the issue"
                  : notificationField === "None"
                    ? null
                    : replaceUnderscoreIfSnakeCase(notificationField)}{" "}
              {notification?.data?.issue_activity.verb !== "deleted" && (
                <>
                  {!["comment", "archived_at", "None"].includes(notificationField) ? "to" : ""}
                  <span className="font-semibold">
                    {" "}
                    {notificationField !== "None" ? (
                      notificationField !== "comment" ? (
                        notificationField === "target_date" ? (
                          renderFormattedDate(notification?.data?.issue_activity.new_value)
                        ) : notificationField === "attachment" ? (
                          "the issue"
                        ) : notificationField === "description" ? (
                          stripAndTruncateHTML(notification?.data?.issue_activity.new_value || "", 55)
                        ) : notificationField === "archived_at" ? null : (
                          notification?.data?.issue_activity.new_value
                        )
                      ) : (
                        <div>comment block here</div>
                      )
                    ) : (
                      "the issue and assigned it to you."
                    )}
                  </span>
                </>
              )}
            </>
          ) : (
            <span className="semi-bold">{notification.message}</span>
          )}
        </div>
      </IssueActivityBlock>
    </div>
  );
};
