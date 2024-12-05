"use client";

import { Dispatch, FC, Fragment, SetStateAction } from "react";
import { observer } from "mobx-react";
import { Clock } from "lucide-react";
import { Popover, Transition } from "@headlessui/react";
import { Tooltip, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { NotificationSnoozeModal } from "@/components/workspace-notifications";
// constants
import { NOTIFICATION_SNOOZE_OPTIONS } from "@/constants/notification";
import { cn } from "@/helpers/common.helper";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// store
import { INotification } from "@/store/notifications/notification";

type TNotificationItemSnoozeOption = {
  workspaceSlug: string;
  notification: INotification;
  setIsSnoozeStateModalOpen: Dispatch<SetStateAction<boolean>>;
  customSnoozeModal: boolean;
  setCustomSnoozeModal: Dispatch<SetStateAction<boolean>>;
};

export const NotificationItemSnoozeOption: FC<TNotificationItemSnoozeOption> = observer((props) => {
  const { workspaceSlug, notification, setIsSnoozeStateModalOpen, customSnoozeModal, setCustomSnoozeModal } = props;
  // hooks
  const { isMobile } = usePlatformOS();
  const {} = useWorkspaceNotifications();
  const { asJson: data, snoozeNotification, unSnoozeNotification } = notification;

  const handleNotificationSnoozeDate = async (snoozeTill: Date | undefined) => {
    if (snoozeTill) {
      try {
        await snoozeNotification(workspaceSlug, snoozeTill);
        setToast({
          title: "Success!",
          message: "Notification snoozed successfully",
          type: TOAST_TYPE.SUCCESS,
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        await unSnoozeNotification(workspaceSlug);
        setToast({
          title: "Success!",
          message: "Notification un snoozed successfully",
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
              <Tooltip tooltipContent={data.snoozed_till ? `Un snooze` : `Snooze`} isMobile={isMobile}>
                <Popover.Button
                  className={cn(
                    "relative flex-shrink-0 w-5 h-5 rounded-sm flex justify-center items-center outline-none bg-custom-background-80 hover:bg-custom-background-90",
                    open ? "bg-custom-background-80" : ""
                  )}
                >
                  <Clock className="h-3 w-3 text-custom-text-300" />
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
                  <div className="p-2 rounded-md border border-custom-border-200 bg-custom-background-100 space-y-1">
                    {data.snoozed_till && (
                      <button
                        className="w-full text-left cursor-pointer px-2 p-1 transition-all hover:bg-custom-background-80 rounded-sm text-custom-text-200 text-sm"
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
                        className="w-full text-left cursor-pointer px-2 p-1 transition-all hover:bg-custom-background-80 rounded-sm text-custom-text-200 text-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDropdownSelect(option.value != undefined ? option.value() : option.value);
                        }}
                      >
                        <div>{option?.label}</div>
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
