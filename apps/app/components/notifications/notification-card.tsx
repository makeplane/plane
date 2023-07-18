import React from "react";

// next
import Image from "next/image";
import { useRouter } from "next/router";

// headless ui
import { Menu, Transition } from "@headlessui/react";

// hooks
import useToast from "hooks/use-toast";

// icons
import { Icon, Tooltip } from "components/ui";

// helper
import { stripHTML, replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
import {
  formatDateDistance,
  renderLongDateFormat,
  renderShortDateWithYearFormat,
} from "helpers/date-time.helper";

// type
import type { IUserNotification } from "types";

type NotificationCardProps = {
  notification: IUserNotification;
  markNotificationReadStatus: (notificationId: string) => Promise<void>;
  markNotificationArchivedStatus: (notificationId: string) => Promise<void>;
  setSelectedNotificationForSnooze: (notificationId: string) => void;
  markSnoozeNotification: (notificationId: string, dateTime?: Date | undefined) => Promise<void>;
};

export const NotificationCard: React.FC<NotificationCardProps> = (props) => {
  const {
    notification,
    markNotificationReadStatus,
    markNotificationArchivedStatus,
    setSelectedNotificationForSnooze,
    markSnoozeNotification,
  } = props;

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  return (
    <div
      key={notification.id}
      onClick={() => {
        markNotificationReadStatus(notification.id);
        router.push(
          `/${workspaceSlug}/projects/${notification.project}/issues/${notification.data.issue.id}`
        );
      }}
      className={`px-4 ${
        notification.read_at === null ? "bg-custom-primary-70/10" : "hover:bg-custom-background-200"
      }`}
    >
      <div className="relative group flex items-center gap-3 py-3 cursor-pointer border-b-2 border-custom-border-200">
        {notification.read_at === null && (
          <span className="absolute top-1/2 -left-2 -translate-y-1/2 w-1.5 h-1.5 bg-custom-primary-100 rounded-full" />
        )}
        <div className="flex w-full pl-2">
          <div className="pl-0 p-2">
            <div className="relative w-12 h-12  rounded-full">
              {notification.triggered_by_details.avatar &&
              notification.triggered_by_details.avatar !== "" ? (
                <Image
                  src={notification.triggered_by_details.avatar}
                  alt="profile image"
                  layout="fill"
                  objectFit="cover"
                  className="rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-custom-background-100 rounded-full flex justify-center items-center">
                  <span className="text-custom-text-100 font-semibold text-lg">
                    {notification.triggered_by_details.first_name[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="w-full flex flex-col overflow-hidden">
            <div>
              <p>
                <span className="font-semibold text-custom-text-200">
                  {notification.triggered_by_details.first_name}{" "}
                  {notification.triggered_by_details.last_name}{" "}
                </span>
                {notification.data.issue_activity.field !== "comment" &&
                  notification.data.issue_activity.verb}{" "}
                {notification.data.issue_activity.field === "comment"
                  ? "commented"
                  : notification.data.issue_activity.field === "None"
                  ? null
                  : replaceUnderscoreIfSnakeCase(notification.data.issue_activity.field)}{" "}
                {notification.data.issue_activity.field !== "comment" &&
                notification.data.issue_activity.field !== "None"
                  ? "to"
                  : ""}
                <span className="font-semibold text-custom-text-200">
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
              </p>
            </div>

            <div className="w-full flex items-center justify-between mt-3">
              <p className="truncate inline max-w-lg text-custom-text-300 text-sm mr-3">
                {notification.data.issue.identifier}-{notification.data.issue.sequence_id}{" "}
                {notification.data.issue.name}
              </p>
              <p className="text-custom-text-300 text-xs">
                {formatDateDistance(notification.created_at)}
              </p>
            </div>
          </div>
        </div>

        <div className="absolute py-1 flex gap-x-3 right-0 top-3 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
          {[
            {
              id: 1,
              name: notification.read_at ? "Mark as Unread" : "Mark as Read",
              icon: "chat_bubble",
              onClick: () => {
                markNotificationReadStatus(notification.id).then(() => {
                  setToastAlert({
                    title: notification.read_at
                      ? "Notification marked as unread"
                      : "Notification marked as read",
                    type: "success",
                  });
                });
              },
            },
            {
              id: 2,
              name: notification.archived_at ? "Unarchive Notification" : "Archive Notification",
              icon: "archive",
              onClick: () => {
                markNotificationArchivedStatus(notification.id).then(() => {
                  setToastAlert({
                    title: notification.archived_at
                      ? "Notification un-archived"
                      : "Notification archived",
                    type: "success",
                  });
                });
              },
            },
            // {
            //   id: 3,
            //   name: notification.snoozed_till ? "Unsnooze Notification" : "Snooze Notification",
            //   icon: "schedule",
            //   onClick: () => {
            //     if (notification.snoozed_till)
            //       markSnoozeNotification(notification.id).then(() => {
            //         setToastAlert({ title: "Notification un-snoozed", type: "success" });
            //       });
            //     else setSelectedNotificationForSnooze(notification.id);
            //   },
            // },
          ].map((item) => (
            <Tooltip tooltipContent={item.name} position="top-left">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick();
                }}
                key={item.id}
                className="text-sm flex w-full items-center gap-x-2 bg-custom-background-80 hover:bg-custom-background-100 p-0.5 rounded"
              >
                <Icon iconName={item.icon} className="h-5 w-5 text-custom-text-300" />
              </button>
            </Tooltip>
          ))}

          <Tooltip tooltipContent="Snooze Notification" position="top-left">
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="text-sm flex w-full items-center gap-x-2 bg-custom-background-80 hover:bg-custom-background-100 p-0.5 rounded"
                >
                  <Icon iconName="schedule" className="h-5 w-5 text-custom-text-300" />
                </Menu.Button>
              </div>

              <Transition
                as={React.Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-28 origin-top-right rounded-md bg-custom-background-100 shadow-lg focus:outline-none">
                  <div className="py-1">
                    {[
                      {
                        label: "1 days",
                        value: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
                      },
                      {
                        label: "3 days",
                        value: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000),
                      },
                      {
                        label: "5 days",
                        value: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000),
                      },
                      {
                        label: "1 week",
                        value: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
                      },
                      {
                        label: "2 weeks",
                        value: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000),
                      },
                      {
                        label: "Custom",
                        value: null,
                      },
                    ].map((item) => (
                      <Menu.Item
                        as="button"
                        className="w-full text-left"
                        onClick={(e) => {
                          e.stopPropagation();

                          if (!item.value) {
                            setSelectedNotificationForSnooze(notification.id);
                            return;
                          }

                          markSnoozeNotification(notification.id, item.value).then(() => {
                            setToastAlert({
                              title: `Notification snoozed till ${renderLongDateFormat(
                                item.value
                              )}`,

                              type: "success",
                            });
                          });
                        }}
                        key={item.label}
                      >
                        {({ active }) => (
                          <span
                            className={`block px-2 py-2 text-sm ${
                              active
                                ? "bg-custom-background-90 text-custom-text-100"
                                : "text-custom-text-300"
                            }`}
                          >
                            {item.label}
                          </span>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
