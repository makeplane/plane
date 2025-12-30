import type { Dispatch, SetStateAction } from "react";
import { Fragment } from "react";
import { observer } from "mobx-react";
import { Clock } from "lucide-react";
import { Popover, Transition } from "@headlessui/react";
// plane imports
import { NOTIFICATION_SNOOZE_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store/notifications";
import { usePlatformOS } from "@/hooks/use-platform-os";
// store
import type { INotification } from "@/store/notifications/notification";
// local imports
import { NotificationSnoozeModal } from "./modal";

type TNotificationItemSnoozeOption = {
  workspaceSlug: string;
  notification: INotification;
  setIsSnoozeStateModalOpen: Dispatch<SetStateAction<boolean>>;
  customSnoozeModal: boolean;
  setCustomSnoozeModal: Dispatch<SetStateAction<boolean>>;
};

export const NotificationItemSnoozeOption = observer(function NotificationItemSnoozeOption(
  props: TNotificationItemSnoozeOption
) {
  const { workspaceSlug, notification, setIsSnoozeStateModalOpen, customSnoozeModal, setCustomSnoozeModal } = props;
  // hooks
  const { isMobile } = usePlatformOS();
  const {} = useWorkspaceNotifications();
  const { t } = useTranslation();
  const { asJson: data, snoozeNotification, unSnoozeNotification } = notification;

  const handleNotificationSnoozeDate = async (snoozeTill: Date | undefined) => {
    if (snoozeTill) {
      try {
        await snoozeNotification(workspaceSlug, snoozeTill);
        setToast({
          title: `${t("common.success")}!`,
          message: t("notification.toasts.snoozed"),
          type: TOAST_TYPE.SUCCESS,
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        await unSnoozeNotification(workspaceSlug);
        setToast({
          title: `${t("common.success")}!`,
          message: t("notification.toasts.un_snoozed"),
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
              <Tooltip
                tooltipContent={
                  data.snoozed_till ? t("notification.options.mark_unsnooze") : t("notification.options.mark_snooze")
                }
                isMobile={isMobile}
              >
                <Popover.Button
                  className={cn(
                    "relative flex-shrink-0 w-5 h-5 rounded-xs flex justify-center items-center outline-none bg-layer-1 hover:bg-surface-2",
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
                    {data.snoozed_till && (
                      <button
                        className="w-full text-left cursor-pointer px-2 p-1 transition-all hover:bg-layer-1 rounded-xs text-secondary text-body-xs-medium"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDropdownSelect("un-snooze");
                        }}
                      >
                        <div>{t("notification.options.mark_unsnooze")}</div>
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
