"use client";

import { FC } from "react";
import { TNotification } from "@plane/types";
import { LiteTextReadOnlyEditor } from "@/components/editor";
// helpers
import { cn } from "@/helpers/common.helper";
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { replaceUnderscoreIfSnakeCase, stripAndTruncateHTML } from "@/helpers/string.helper";
// components
import { IssueActivityBlock } from "@/plane-web/components/workspace-notifications";

export type TNotificationPreviewActivity = {
  notification: TNotification;
  ends: "top" | "bottom" | "single" | undefined;
  workspaceSlug: string;
  projectId: string;
};
export const NotificationPreviewActivity: FC<TNotificationPreviewActivity> = (props) => {
  const { notification, workspaceSlug, ends, projectId } = props;
  const notificationField = notification?.data?.issue_activity.field || undefined;
  const notificationTriggeredBy = notification.triggered_by_details || undefined;
  const triggeredBy = notification.triggered_by_details;

  if (!workspaceSlug || !notification.id || !notification?.id || !notificationField) return <></>;

  return (
    <div className={cn("flex gap-2 items-center", ends === "bottom" ? "pb-4" : "")}>
      <IssueActivityBlock
        ends={ends}
        notificationField={notificationField}
        createdAt={notification?.created_at}
        triggeredBy={triggeredBy}
      >
        <div className="w-full whitespace-normal truncate text-sm">
          <>
            <span className="text-custom-text-100 font-medium">
              {notificationTriggeredBy?.is_bot
                ? notificationTriggeredBy?.first_name
                : notificationTriggeredBy?.display_name}{" "}
            </span>
            <span className="text-custom-text-300">
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
            </span>
            {notification?.data?.issue_activity.verb !== "deleted" && (
              <>
                <span className="text-custom-text-300">
                  {!["comment", "archived_at", "None"].includes(notificationField) ? "to" : ""}
                </span>
                <span className="text-custom-text-100 font-medium">
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
                      <></>
                    )
                  ) : (
                    "the issue and assigned it to you."
                  )}
                </span>
                {notificationField === "comment" && (
                  <div className="scale-75 origin-left">
                    <LiteTextReadOnlyEditor
                      id={""}
                      initialValue={notification.data?.issue_activity.new_value ?? ""}
                      workspaceSlug={workspaceSlug}
                      projectId={projectId}
                    />
                  </div>
                )}
              </>
            )}
          </>
        </div>
      </IssueActivityBlock>
    </div>
  );
};
