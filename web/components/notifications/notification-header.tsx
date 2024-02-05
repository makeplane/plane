import React from "react";
import { ArrowLeft, CheckCheck, Clock, ListFilter, MoreVertical, RefreshCw, X } from "lucide-react";
// ui
import { ArchiveIcon, CustomMenu, Tooltip } from "@plane/ui";
// helpers
import { getNumberCount } from "helpers/string.helper";
// type
import type { NotificationType, NotificationCount } from "@plane/types";

type NotificationHeaderProps = {
  notificationCount?: NotificationCount | null;
  notificationMutate: () => void;
  closePopover: () => void;
  isRefreshing?: boolean;
  snoozed: boolean;
  archived: boolean;
  readNotification: boolean;
  selectedTab: NotificationType;
  setSnoozed: React.Dispatch<React.SetStateAction<boolean>>;
  setArchived: React.Dispatch<React.SetStateAction<boolean>>;
  setReadNotification: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedTab: React.Dispatch<React.SetStateAction<NotificationType>>;
  markAllNotificationsAsRead: () => Promise<void>;
};

export const NotificationHeader: React.FC<NotificationHeaderProps> = (props) => {
  const {
    notificationCount,
    notificationMutate,
    closePopover,
    isRefreshing,
    snoozed,
    archived,
    readNotification,
    selectedTab,
    setSnoozed,
    setArchived,
    setReadNotification,
    setSelectedTab,
    markAllNotificationsAsRead,
  } = props;

  const notificationTabs: Array<{
    label: string;
    value: NotificationType;
    unreadCount?: number;
  }> = [
    {
      label: "My Issues",
      value: "assigned",
      unreadCount: notificationCount?.my_issues,
    },
    {
      label: "Created by me",
      value: "created",
      unreadCount: notificationCount?.created_issues,
    },
    {
      label: "Subscribed",
      value: "watching",
      unreadCount: notificationCount?.watching_issues,
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-5">
        <h2 className="mb-2 text-xl font-semibold">Notifications</h2>
        <div className="flex items-center justify-center gap-x-4 text-custom-text-200">
          <Tooltip tooltipContent="Refresh">
            <button
              type="button"
              onClick={() => {
                notificationMutate();
              }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </Tooltip>
          <Tooltip tooltipContent="Unread notifications">
            <button
              type="button"
              onClick={() => {
                setSnoozed(false);
                setArchived(false);
                setReadNotification((prev) => !prev);
              }}
            >
              <ListFilter className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
          <CustomMenu
            customButton={
              <div className="grid place-items-center ">
                <MoreVertical className="h-3.5 w-3.5" />
              </div>
            }
            closeOnSelect
          >
            <CustomMenu.MenuItem onClick={markAllNotificationsAsRead}>
              <div className="flex items-center gap-2">
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all as read
              </div>
            </CustomMenu.MenuItem>
            <CustomMenu.MenuItem
              onClick={() => {
                setArchived(false);
                setReadNotification(false);
                setSnoozed((prev) => !prev);
              }}
            >
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Show snoozed
              </div>
            </CustomMenu.MenuItem>
            <CustomMenu.MenuItem
              onClick={() => {
                setSnoozed(false);
                setReadNotification(false);
                setArchived((prev) => !prev);
              }}
            >
              <div className="flex items-center gap-2">
                <ArchiveIcon className="h-3.5 w-3.5" />
                Show archived
              </div>
            </CustomMenu.MenuItem>
          </CustomMenu>
          <Tooltip tooltipContent="Close">
            <button type="button" onClick={() => closePopover()}>
              <X className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>
      </div>
      <div className="mt-5 w-full border-b border-custom-border-300 px-5">
        {snoozed || archived || readNotification ? (
          <button
            type="button"
            onClick={() => {
              setSnoozed(false);
              setArchived(false);
              setReadNotification(false);
            }}
          >
            <h4 className="flex items-center gap-2 pb-4">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="ml-2 font-medium">
                {snoozed
                  ? "Snoozed Notifications"
                  : readNotification
                  ? "Unread Notifications"
                  : "Archived Notifications"}
              </span>
            </h4>
          </button>
        ) : (
          <nav className="flex space-x-5 overflow-x-auto" aria-label="Tabs">
            {notificationTabs.map((tab) => (
              <button
                type="button"
                key={tab.value}
                onClick={() => setSelectedTab(tab.value)}
                className={`whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium outline-none ${
                  tab.value === selectedTab
                    ? "border-custom-primary-100 text-custom-primary-100"
                    : "border-transparent text-custom-text-200"
                }`}
              >
                {tab.label}
                {tab.unreadCount && tab.unreadCount > 0 ? (
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                      tab.value === selectedTab
                        ? "bg-custom-primary-100 text-white"
                        : "bg-custom-background-80 text-custom-text-200"
                    }`}
                  >
                    {getNumberCount(tab.unreadCount)}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        )}
      </div>
    </>
  );
};
