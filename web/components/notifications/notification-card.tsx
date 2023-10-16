import React from "react";

import Image from "next/image";
import { useRouter } from "next/router";

// hooks
import useToast from "hooks/use-toast";

// icons
import { CustomMenu, Icon } from "components/ui";
import { Tooltip } from "@plane/ui";

// helper
import { stripHTML, replaceUnderscoreIfSnakeCase, truncateText } from "helpers/string.helper";
import {
  formatDateDistance,
  render12HourFormatTime,
  renderLongDateFormat,
  renderShortDate,
  renderShortDateWithYearFormat,
} from "helpers/date-time.helper";

// type
import type { IUserNotification } from "types";
// constants
import { snoozeOptions } from "constants/notification";

type NotificationCardProps = {
  notification: IUserNotification;
  markNotificationReadStatus: (notificationId: string) => Promise<void>;
  markNotificationReadStatusToggle: (notificationId: string) => Promise<void>;
  markNotificationArchivedStatus: (notificationId: string) => Promise<void>;
  setSelectedNotificationForSnooze: (notificationId: string) => void;
  markSnoozeNotification: (notificationId: string, dateTime?: Date | undefined) => Promise<void>;
};

export const NotificationCard: React.FC<NotificationCardProps> = (props) => {
  const {
    notification,
    markNotificationReadStatus,
    markNotificationReadStatusToggle,
    markNotificationArchivedStatus,
    setSelectedNotificationForSnooze,
    markSnoozeNotification,
  } = props;

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  return (
    <div
      onClick={() => {
        markNotificationReadStatus(notification.id);
        router.push(
          `/${workspaceSlug}/projects/${notification.project}/${
            notification.data.issue_activity.field === "archived_at" ? "archived-issues" : "issues"
          }/${notification.data.issue.id}`
        );
      }}
      className={`group w-full flex items-center gap-4 p-3 pl-6 relative cursor-pointer ${
        notification.read_at === null ? "bg-custom-primary-70/5" : "hover:bg-custom-background-200"
      }`}
    >
      {notification.read_at === null && (
        <span className="absolute top-1/2 left-2 -translate-y-1/2 w-1.5 h-1.5 bg-custom-primary-100 rounded-full" />
      )}
      <div className="relative w-12 h-12 rounded-full">
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
          <div className="w-12 h-12 bg-custom-background-80 rounded-full flex justify-center items-center">
            <span className="text-custom-text-100 font-medium text-lg">
              {notification.triggered_by_details.is_bot ? (
                notification.triggered_by_details.first_name?.[0]?.toUpperCase()
              ) : notification.triggered_by_details.display_name?.[0] ? (
                notification.triggered_by_details.display_name?.[0]?.toUpperCase()
              ) : (
                <Icon iconName="person" className="h-6 w-6" />
              )}
            </span>
          </div>
        )}
      </div>
      <div className="space-y-2.5 w-full overflow-hidden">
        <div className="text-sm w-full break-words">
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
                  renderShortDateWithYearFormat(notification.data.issue_activity.new_value)
                ) : notification.data.issue_activity.field === "attachment" ? (
                  "the issue"
                ) : stripHTML(notification.data.issue_activity.new_value).length > 55 ? (
                  stripHTML(notification.data.issue_activity.new_value).slice(0, 50) + "..."
                ) : (
                  stripHTML(notification.data.issue_activity.new_value)
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

        <div className="flex justify-between gap-2 text-xs">
          <p className="text-custom-text-300">
            {truncateText(
              `${notification.data.issue.identifier}-${notification.data.issue.sequence_id} ${notification.data.issue.name}`,
              50
            )}
          </p>
          {notification.snoozed_till ? (
            <p className="text-custom-text-300 flex items-center justify-end gap-x-1 flex-shrink-0">
              <Icon iconName="schedule" className="!text-base -my-0.5" />
              <span>
                Till {renderShortDate(notification.snoozed_till)}, {render12HourFormatTime(notification.snoozed_till)}
              </span>
            </p>
          ) : (
            <p className="text-custom-text-300 flex-shrink-0">{formatDateDistance(notification.created_at)}</p>
          )}
        </div>
      </div>
      <div className="absolute py-1 gap-x-3 right-3 top-3 hidden group-hover:flex">
        {[
          {
            id: 1,
            name: notification.read_at ? "Mark as unread" : "Mark as read",
            icon: "chat_bubble",
            onClick: () => {
              markNotificationReadStatusToggle(notification.id).then(() => {
                setToastAlert({
                  title: notification.read_at ? "Notification marked as unread" : "Notification marked as read",
                  type: "success",
                });
              });
            },
          },
          {
            id: 2,
            name: notification.archived_at ? "Unarchive" : "Archive",
            icon: notification.archived_at ? "unarchive" : "archive",
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
                item.onClick();
              }}
              key={item.id}
              className="text-sm flex w-full items-center gap-x-2 bg-custom-background-80 hover:bg-custom-background-100 p-0.5 rounded outline-none"
            >
              <Icon iconName={item.icon} className="h-5 w-5 text-custom-text-300" />
            </button>
          </Tooltip>
        ))}

        <Tooltip tooltipContent="Snooze">
          <div>
            <CustomMenu
              menuButtonOnClick={(e: { stopPropagation: () => void }) => {
                e.stopPropagation();
              }}
              customButton={
                <div className="text-sm flex w-full items-center gap-x-2 bg-custom-background-80 hover:bg-custom-background-100 p-0.5 rounded">
                  <Icon iconName="schedule" className="h-5 w-5 text-custom-text-300" />
                </div>
              }
              optionsClassName="!z-20"
            >
              {snoozeOptions.map((item) => (
                <CustomMenu.MenuItem
                  key={item.label}
                  renderAs="button"
                  onClick={(e) => {
                    e.stopPropagation();

                    if (!item.value) {
                      setSelectedNotificationForSnooze(notification.id);
                      return;
                    }

                    markSnoozeNotification(notification.id, item.value).then(() => {
                      setToastAlert({
                        title: `Notification snoozed till ${renderLongDateFormat(item.value)}`,
                        type: "success",
                      });
                    });
                  }}
                >
                  {item.label}
                </CustomMenu.MenuItem>
              ))}
            </CustomMenu>
          </div>
        </Tooltip>
      </div>
    </div>
  );
};
