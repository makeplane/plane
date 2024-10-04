"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { Clock } from "lucide-react";
import { Avatar, Row } from "@plane/ui";
// components
import { NotificationOption } from "@/components/workspace-notifications";
// helpers
import { cn } from "@/helpers/common.helper";
import { calculateTimeAgo, renderFormattedDate, renderFormattedTime } from "@/helpers/date-time.helper";
import { sanitizeCommentForNotification } from "@/helpers/notification.helper";
import { replaceUnderscoreIfSnakeCase, stripAndTruncateHTML } from "@/helpers/string.helper";
// hooks
import { useIssueDetail, useNotification, useWorkspaceNotifications } from "@/hooks/store";

type TNotificationItem = {
  workspaceSlug: string;
  notificationId: string;
};

export const NotificationItem: FC<TNotificationItem> = observer((props) => {
  const { workspaceSlug, notificationId } = props;
  // hooks
  const { currentSelectedNotificationId, setCurrentSelectedNotificationId } = useWorkspaceNotifications();
  const { asJson: notification, markNotificationAsRead } = useNotification(notificationId);
  const { getIsIssuePeeked, setPeekIssue } = useIssueDetail();
  // states
  const [isSnoozeStateModalOpen, setIsSnoozeStateModalOpen] = useState(false);
  const [customSnoozeModal, setCustomSnoozeModal] = useState(false);

  // derived values
  const projectId = notification?.project || undefined;
  const issueId = notification?.data?.issue?.id || undefined;

  const notificationField = notification?.data?.issue_activity.field || undefined;
  const notificationTriggeredBy = notification.triggered_by_details || undefined;

  const handleNotificationIssuePeekOverview = async () => {
    if (workspaceSlug && projectId && issueId && !isSnoozeStateModalOpen && !customSnoozeModal) {
      setPeekIssue(undefined);
      setCurrentSelectedNotificationId(notificationId);

      // make the notification as read
      if (notification.read_at === null) {
        try {
          await markNotificationAsRead(workspaceSlug);
        } catch (error) {
          console.error(error);
        }
      }

      if (notification?.is_inbox_issue === false) {
        !getIsIssuePeeked(issueId) && setPeekIssue({ workspaceSlug, projectId, issueId });
      }
    }
  };

  if (!workspaceSlug || !notificationId || !notification?.id || !notificationField) return <></>;

  return (
    <Row
      className={cn(
        "relative py-4 flex items-center gap-2 border-b border-custom-border-200 cursor-pointer transition-all group",
        currentSelectedNotificationId === notification?.id ? "bg-custom-background-80/30" : "",
        notification.read_at === null ? "bg-custom-primary-100/5" : ""
      )}
      onClick={handleNotificationIssuePeekOverview}
    >
      {notification.read_at === null && (
        <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-custom-primary-100 absolute top-[50%] left-2" />
      )}

      <div className="relative w-full flex gap-2">
        <div className="flex-shrink-0 relative flex justify-center items-center w-12 h-12 bg-custom-background-80 rounded-full">
          {notificationTriggeredBy && (
            <Avatar
              name={notificationTriggeredBy.display_name || notificationTriggeredBy?.first_name}
              src={notificationTriggeredBy.avatar ?? undefined}
              size={42}
              shape="circle"
              className="!text-base !bg-custom-background-80"
            />
          )}
        </div>

        <div className="w-full space-y-1 -mt-2">
          <div className="relative flex items-center gap-3 h-8">
            <div className="w-full overflow-hidden whitespace-normal break-all truncate line-clamp-1 text-sm text-custom-text-100">
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
                            <span>
                              {sanitizeCommentForNotification(
                                notification?.data?.issue_activity.new_value ?? undefined
                              )}
                            </span>
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
            <NotificationOption
              workspaceSlug={workspaceSlug}
              notificationId={notification?.id}
              isSnoozeStateModalOpen={isSnoozeStateModalOpen}
              setIsSnoozeStateModalOpen={setIsSnoozeStateModalOpen}
              customSnoozeModal={customSnoozeModal}
              setCustomSnoozeModal={setCustomSnoozeModal}
            />
          </div>

          <div className="relative flex items-center gap-3 text-xs text-custom-text-200">
            <div className="w-full overflow-hidden whitespace-normal break-words truncate line-clamp-1">
              {notification?.data?.issue?.identifier}-{notification?.data?.issue?.sequence_id}&nbsp;
              {notification?.data?.issue?.name}
            </div>
            <div className="flex-shrink-0">
              {notification?.snoozed_till ? (
                <p className="flex flex-shrink-0 items-center justify-end gap-x-1 text-custom-text-300">
                  <Clock className="h-4 w-4" />
                  <span>
                    Till {renderFormattedDate(notification.snoozed_till)},&nbsp;
                    {renderFormattedTime(notification.snoozed_till, "12-hour")}
                  </span>
                </p>
              ) : (
                <p className="mt-auto flex-shrink-0 text-custom-text-300">
                  {notification.created_at && calculateTimeAgo(notification.created_at)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Row>
  );
});
