import React from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { ArchiveRestore, Clock, MessageSquare, User2 } from "lucide-react";
import Link from "next/link";
// hooks
import useToast from "hooks/use-toast";
// icons
import { ArchiveIcon, CustomMenu, Tooltip } from "@plane/ui";
// constants
import { snoozeOptions } from "constants/notification";
// helper
import { replaceUnderscoreIfSnakeCase, truncateText, stripAndTruncateHTML } from "helpers/string.helper";
import { calculateTimeAgo, renderFormattedTime, renderFormattedDate } from "helpers/date-time.helper";
// type
import type { IUserNotification } from "@plane/types";

type NotificationCardProps = {
  notification: IUserNotification;
  isSnoozedTabOpen: boolean;
  closePopover: () => void;
  markNotificationReadStatus: (notificationId: string) => Promise<void>;
  markNotificationReadStatusToggle: (notificationId: string) => Promise<void>;
  markNotificationArchivedStatus: (notificationId: string) => Promise<void>;
  setSelectedNotificationForSnooze: (notificationId: string) => void;
  markSnoozeNotification: (notificationId: string, dateTime?: Date | undefined) => Promise<void>;
};

export const NotificationCard: React.FC<NotificationCardProps> = (props) => {
  const {
    notification,
    isSnoozedTabOpen,
    closePopover,
    markNotificationReadStatus,
    markNotificationReadStatusToggle,
    markNotificationArchivedStatus,
    setSelectedNotificationForSnooze,
    markSnoozeNotification,
  } = props;

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  if (isSnoozedTabOpen && new Date(notification.snoozed_till!) < new Date()) return null;

  return (
    <Link
      onClick={() => {
        markNotificationReadStatus(notification.id);
        closePopover();
      }}
      href={`/${workspaceSlug}/projects/${notification.project}/${
        notification.data.issue_activity.field === "archived_at" ? "archived-issues" : "issues"
      }/${notification.data.issue.id}`}
      className={`group relative flex w-full cursor-pointer items-center gap-4 p-3 pl-6 ${
        notification.read_at === null ? "bg-custom-primary-70/5" : "hover:bg-custom-background-200"
      }`}
    >
      {notification.read_at === null && (
        <span className="absolute left-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-custom-primary-100" />
      )}
      <div className="relative h-12 w-12 rounded-full">
        {notification.triggered_by_details.avatar && notification.triggered_by_details.avatar !== "" ? (
          <div className="h-12 w-12 rounded-full">
            <Image
              src={notification.triggered_by_details.avatar}
              alt="Profile Image"
              layout="fill"
              objectFit="cover"
              className="rounded-full"
            />
          </div>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-custom-background-80">
            <span className="text-lg font-medium text-custom-text-100">
              {notification.triggered_by_details.is_bot ? (
                notification.triggered_by_details.first_name?.[0]?.toUpperCase()
              ) : notification.triggered_by_details.display_name?.[0] ? (
                notification.triggered_by_details.display_name?.[0]?.toUpperCase()
              ) : (
                <User2 className="h-4 w-4" />
              )}
            </span>
          </div>
        )}
      </div>
      <div className="w-full space-y-2.5 overflow-hidden">
        {!notification.message ? (
          <div className="w-full break-words text-sm">
            <span className="font-semibold">
              {notification.triggered_by_details.is_bot
                ? notification.triggered_by_details.first_name
                : notification.triggered_by_details.display_name}{" "}
            </span>
            {notification.data.issue_activity.field !== "comment" && notification.data.issue_activity.verb}{" "}
            {notification.data.issue_activity.field === "comment"
              ? "commented"
              : notification.data.issue_activity.field === "None"
              ? null
              : replaceUnderscoreIfSnakeCase(notification.data.issue_activity.field)}{" "}
            {notification.data.issue_activity.field !== "comment" && notification.data.issue_activity.field !== "None"
              ? "to"
              : ""}
            <span className="font-semibold">
              {" "}
              {notification.data.issue_activity.field !== "None" ? (
                notification.data.issue_activity.field !== "comment" ? (
                  notification.data.issue_activity.field === "target_date" ? (
                    renderFormattedDate(notification.data.issue_activity.new_value)
                  ) : notification.data.issue_activity.field === "attachment" ? (
                    "the issue"
                  ) : notification.data.issue_activity.field === "description" ? (
                    stripAndTruncateHTML(notification.data.issue_activity.new_value, 55)
                  ) : (
                    notification.data.issue_activity.new_value
                  )
                ) : (
                  <span>
                    {`"`}
                    {notification.data.issue_activity.new_value.length > 55
                      ? notification?.data?.issue_activity?.issue_comment?.slice(0, 50) + "..."
                      : notification.data.issue_activity.issue_comment}
                    {`"`}
                  </span>
                )
              ) : (
                "the issue and assigned it to you."
              )}
            </span>
          </div>
        ) : (
          <div className="w-full break-words text-sm">
            <span className="semi-bold">{notification.message}</span>
          </div>
        )}

        <div className="flex justify-between gap-2 text-xs">
          <p className="text-custom-text-300">
            {truncateText(
              `${notification.data.issue.identifier}-${notification.data.issue.sequence_id} ${notification.data.issue.name}`,
              50
            )}
          </p>
          {notification.snoozed_till ? (
            <p className="flex flex-shrink-0 items-center justify-end gap-x-1 text-custom-text-300">
              <Clock className="h-4 w-4" />
              <span>
                Till {renderFormattedDate(notification.snoozed_till)},{" "}
                {renderFormattedTime(notification.snoozed_till, "12-hour")}
              </span>
            </p>
          ) : (
            <p className="flex-shrink-0 text-custom-text-300">{calculateTimeAgo(notification.created_at)}</p>
          )}
        </div>
      </div>
      <div className="absolute right-3 top-3 hidden gap-x-3 py-1 group-hover:flex">
        {[
          {
            id: 1,
            name: notification.read_at ? "Mark as unread" : "Mark as read",
            icon: <MessageSquare className="h-3.5 w-3.5 text-custom-text-300" />,
            onClick: () => {
              markNotificationReadStatusToggle(notification.id).then(() => {
                setToastAlert({
                  title: notification.read_at ? "Notification marked as read" : "Notification marked as unread",
                  type: "success",
                });
              });
            },
          },
          {
            id: 2,
            name: notification.archived_at ? "Unarchive" : "Archive",
            icon: notification.archived_at ? (
              <ArchiveRestore className="h-3.5 w-3.5 text-custom-text-300" />
            ) : (
              <ArchiveIcon className="h-3.5 w-3.5 text-custom-text-300" />
            ),
            onClick: () => {
              markNotificationArchivedStatus(notification.id).then(() => {
                setToastAlert({
                  title: notification.archived_at ? "Notification un-archived" : "Notification archived",
                  type: "success",
                });
              });
            },
          },
        ].map((item) => (
          <Tooltip tooltipContent={item.name}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();

                item.onClick();
              }}
              key={item.id}
              className="flex w-full items-center gap-x-2 rounded bg-custom-background-80 p-0.5 text-sm outline-none hover:bg-custom-background-100"
            >
              {item.icon}
            </button>
          </Tooltip>
        ))}
        <Tooltip tooltipContent="Snooze">
          <CustomMenu
            className="flex items-center"
            menuButtonOnClick={(e: { stopPropagation: () => void }) => {
              e.stopPropagation();
            }}
            customButton={
              <div className="flex w-full items-center gap-x-2 rounded bg-custom-background-80 p-0.5 text-sm hover:bg-custom-background-100">
                <Clock className="h-3.5 w-3.5 text-custom-text-300" />
              </div>
            }
            optionsClassName="!z-20"
          >
            {snoozeOptions.map((item) => (
              <CustomMenu.MenuItem
                key={item.label}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();

                  if (!item.value) {
                    setSelectedNotificationForSnooze(notification.id);
                    return;
                  }

                  markSnoozeNotification(notification.id, item.value).then(() => {
                    setToastAlert({
                      title: `Notification snoozed till ${renderFormattedDate(item.value)}`,
                      type: "success",
                    });
                  });
                }}
              >
                {item.label}
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>
        </Tooltip>
      </div>
    </Link>
  );
};
