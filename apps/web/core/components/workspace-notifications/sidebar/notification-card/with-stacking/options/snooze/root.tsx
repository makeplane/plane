/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { Dispatch, FC, SetStateAction } from "react";
import { Fragment } from "react";
import { observer } from "mobx-react";
import { Clock } from "lucide-react";
import { Popover, Transition } from "@headlessui/react";
// plane imports
import { NOTIFICATION_SNOOZE_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
// components
import { NotificationSnoozeModal } from "@/components/workspace-notifications/sidebar/notification-card/common/snooze-modal";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store/notifications";
import { usePlatformOS } from "@/hooks/use-platform-os";
// store
import type { INotification } from "@/store/notifications/notification";

type TNotificationItemSnoozeOption = {
  workspaceSlug: string;
  notificationList: INotification[];
  setIsSnoozeStateModalOpen: Dispatch<SetStateAction<boolean>>;
  customSnoozeModal: boolean;
  setCustomSnoozeModal: Dispatch<SetStateAction<boolean>>;
};

export const NotificationItemSnoozeOption = observer(function NotificationItemSnoozeOption(
  props: TNotificationItemSnoozeOption
) {
  const { workspaceSlug, notificationList, setIsSnoozeStateModalOpen, customSnoozeModal, setCustomSnoozeModal } = props;
  // plane imports
  const { t } = useTranslation();
  // hooks
  const { isMobile } = usePlatformOS();
  const { snoozeNotificationList, unSnoozeNotificationList } = useWorkspaceNotifications();

  const snoozedCount = notificationList.filter((n) => !!n.snoozed_till).length;

  const handleNotificationSnoozeDate = async (snoozeTill: Date | undefined) => {
    if (snoozedCount === 0 && snoozeTill) {
      try {
        await snoozeNotificationList(notificationList, workspaceSlug, snoozeTill);
        setToast({
          title: "Success!",
          message: "Notification(s) snoozed successfully",
          type: TOAST_TYPE.SUCCESS,
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        await unSnoozeNotificationList(notificationList, workspaceSlug);
        setToast({
          title: "Success!",
          message: "Notification(s) un snoozed successfully",
          type: TOAST_TYPE.SUCCESS,
        });
      } catch (e) {
        console.error(e);
      }
    }

    setCustomSnoozeModal(false);
    setIsSnoozeStateModalOpen(false);
  };

  const handleDropdownSelect = (snoozeDate: Date | "un-snooze" | undefined) => {
    if (snoozeDate === "un-snooze") {
      handleNotificationSnoozeDate(undefined);
      return;
    }
    if (snoozeDate) {
      handleNotificationSnoozeDate(snoozeDate);
    } else {
      setCustomSnoozeModal(true);
    }
  };

  return (
    <>
      <NotificationSnoozeModal
        isOpen={customSnoozeModal}
        onClose={() => setCustomSnoozeModal(false)}
        onSubmit={handleNotificationSnoozeDate}
      />
      <Popover className="relative">
        {({ open }) => {
          if (open) setIsSnoozeStateModalOpen(true);
          else setIsSnoozeStateModalOpen(false);

          return (
            <>
              <Tooltip tooltipContent={snoozedCount > 0 ? `Un snooze` : `Snooze`} isMobile={isMobile}>
                <Popover.Button
                  className={cn(
                    "relative flex-shrink-0 w-5 h-5 rounded-xs flex justify-center items-center outline-none bg-layer-1 hover:bg-layer-1",
                    open ? "bg-layer-1" : ""
                  )}
                >
                  <Clock className="h-3 w-3 text-tertiary" />
                </Popover.Button>
              </Tooltip>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel className="absolute mt-2 right-0 z-10 min-w-44 select-none">
                  <div className="p-2 rounded-md border border-subtle bg-surface-1 space-y-1">
                    {snoozedCount > 0 && (
                      <button
                        className="w-full text-left cursor-pointer px-2 p-1 transition-all hover:bg-layer-1 rounded-xs text-secondary text-body-xs-medium"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDropdownSelect("un-snooze");
                        }}
                      >
                        <div>Un snooze</div>
                      </button>
                    )}

                    {NOTIFICATION_SNOOZE_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        className="w-full text-left cursor-pointer px-2 p-1 transition-all hover:bg-layer-1 rounded-xs text-secondary text-body-xs-medium"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDropdownSelect(option.value != undefined ? option.value() : option.value);
                        }}
                      >
                        <div>{t(option?.i18n_label)}</div>
                      </button>
                    ))}
                  </div>
                </Popover.Panel>
              </Transition>
            </>
          );
        }}
      </Popover>
    </>
  );
});
