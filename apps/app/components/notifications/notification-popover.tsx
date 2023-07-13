import React, { Fragment } from "react";

import Image from "next/image";

// hooks
import useTheme from "hooks/use-theme";
// icons
import {
  XMarkIcon,
  ArchiveIcon,
  ClockIcon,
  SortIcon,
  BellNotificationIcon,
} from "components/icons";

import { Popover, Transition, Menu } from "@headlessui/react";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";

// hooks
import useUserNotification from "hooks/use-user-notifications";

// components
import { Spinner } from "components/ui";
import { SnoozeNotificationModal, NotificationCard } from "components/notifications";

// type
import type { NotificationType } from "types";

const notificationTabs: Array<{
  label: string;
  value: NotificationType;
}> = [
  {
    label: "My Issues",
    value: "assigned",
  },
  {
    label: "Created by me",
    value: "created",
  },
  {
    label: "Subscribed",
    value: "watching",
  },
];

export const NotificationPopover = () => {
  const {
    notifications,
    archived,
    readNotification,
    selectedNotificationForSnooze,
    selectedTab,
    setArchived,
    setReadNotification,
    setSelectedNotificationForSnooze,
    setSelectedTab,
    setSnoozed,
    snoozed,
    notificationsMutate,
    markNotificationArchivedStatus,
    markNotificationReadStatus,
  } = useUserNotification();

  // theme context
  const { collapsed: sidebarCollapse } = useTheme();

  return (
    <>
      <SnoozeNotificationModal
        isOpen={selectedNotificationForSnooze !== null}
        onClose={() => setSelectedNotificationForSnooze(null)}
        notificationId={selectedNotificationForSnooze}
        onSuccess={() => {
          notificationsMutate();
          setSelectedNotificationForSnooze(null);
        }}
      />
      <Popover className="relative w-full">
        {({ open: isActive, close: closePopover }) => (
          <>
            <Popover.Button
              className={`${
                isActive
                  ? "bg-custom-sidebar-background-90 text-custom-sidebar-text-100"
                  : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-90"
              } group flex w-full items-center gap-3 rounded-md p-2 text-sm font-medium outline-none ${
                sidebarCollapse ? "justify-center" : ""
              }`}
            >
              <span className="grid h-5 w-5 flex-shrink-0 place-items-center">
                <BellNotificationIcon
                  color={
                    isActive
                      ? "rgb(var(--color-sidebar-text-100))"
                      : "rgb(var(--color-sidebar-text-200))"
                  }
                  aria-hidden="true"
                  height="20"
                  width="20"
                />
              </span>
              {sidebarCollapse ? null : <span>Notifications</span>}
            </Popover.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute bg-custom-background-100 flex flex-col left-0 md:left-full z-10 mt-3 pt-5 md:w-[36rem] w-[20rem] h-[30rem] border border-custom-background-90 shadow-lg rounded">
                <div className="flex justify-between items-center md:px-6 px-2">
                  <h2 className="text-custom-sidebar-text-100 text-lg font-semibold mb-2">
                    Notifications
                  </h2>
                  <div className="flex gap-x-2 justify-center items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSnoozed(false);
                        setArchived(false);
                        setReadNotification((prev) => !prev);
                      }}
                    >
                      <SortIcon className="h-6 w-6 text-custom-text-300" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setArchived(false);
                        setReadNotification(false);
                        setSnoozed((prev) => !prev);
                      }}
                    >
                      <ClockIcon className="h-6 w-6 text-custom-text-300" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSnoozed(false);
                        setReadNotification(false);
                        setArchived((prev) => !prev);
                      }}
                    >
                      <ArchiveIcon className="h-6 w-6 text-custom-text-300" />
                    </button>
                    <button type="button" onClick={() => closePopover()}>
                      <XMarkIcon className="h-6 w-6 text-custom-text-300" />
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex flex-col items-center">
                  {snoozed || archived || readNotification ? (
                    <div className="w-full mb-3">
                      <div className="flex flex-col flex-1 px-2 md:px-6 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setSnoozed(false);
                            setArchived(false);
                            setReadNotification(false);
                          }}
                        >
                          <h4 className="text-custom-text-300 text-center flex items-center">
                            <ArrowLeftIcon className="h-5 w-5 text-custom-text-300" />
                            <span className="ml-2 font-semibold">
                              {snoozed
                                ? "Snoozed Notifications"
                                : readNotification
                                ? "Read Notifications"
                                : "Archived Notifications"}
                            </span>
                          </h4>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-b border-custom-border-300 md:px-6 px-2 w-full">
                      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {notificationTabs.map((tab) => (
                          <button
                            type="button"
                            key={tab.value}
                            onClick={() => setSelectedTab(tab.value)}
                            className={`whitespace-nowrap border-b-2 pb-4 px-1 text-sm font-medium ${
                              tab.value === selectedTab
                                ? "border-custom-primary-100 text-custom-primary-100"
                                : "border-transparent text-custom-text-500 hover:border-custom-border-300 hover:text-custom-text-200"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </nav>
                    </div>
                  )}
                </div>

                <div className="w-full flex-1 overflow-y-auto">
                  {notifications ? (
                    notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <NotificationCard
                          key={notification.id}
                          notification={notification}
                          markNotificationArchivedStatus={markNotificationArchivedStatus}
                          markNotificationReadStatus={markNotificationReadStatus}
                          setSelectedNotificationForSnooze={setSelectedNotificationForSnooze}
                        />
                      ))
                    ) : (
                      <div className="flex flex-col w-full h-full justify-center items-center">
                        <Image
                          src="/empty-state/empty-notification.svg"
                          alt="Empty"
                          width={200}
                          height={200}
                          layout="fixed"
                        />
                        <h4 className="text-custom-text-300 text-lg font-semibold">
                          You{"'"}re updated with all the notifications
                        </h4>
                        <p className="text-custom-text-300 text-sm mt-2">
                          You have read all the notifications.
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="flex w-full h-full justify-center items-center">
                      <Spinner />
                    </div>
                  )}
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </>
  );
};
