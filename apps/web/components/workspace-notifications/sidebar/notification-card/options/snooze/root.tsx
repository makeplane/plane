/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Dispatch, SetStateAction } from "react";
import { observer } from "mobx-react";
import { ClockOutline } from "@makeplane/propel/icons";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
// plane imports
import { NOTIFICATION_SNOOZE_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setToast } from "@plane/blocks/toast";
import { Tooltip } from "@makeplane/propel/components/tooltip";
// hooks
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
  const { t } = useTranslation();
  const { asJson: data, snoozeNotification, unSnoozeNotification } = notification;

  const handleNotificationSnoozeDate = async (snoozeTill: Date | undefined) => {
    if (snoozeTill) {
      try {
        await snoozeNotification(workspaceSlug, snoozeTill);
        setToast({
          title: `${t("common.success")}!`,
          message: t("notification.toasts.snoozed"),
          type: "success",
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        await unSnoozeNotification(workspaceSlug);
        setToast({
          title: `${t("common.success")}!`,
          message: t("notification.toasts.unsnoozed"),
          type: "success",
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
      void handleNotificationSnoozeDate(undefined);
      return;
    }
    if (snoozeDate) {
      void handleNotificationSnoozeDate(snoozeDate);
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
      {/* Command rows, not a value picker — each row snoozes by a preset and nothing stays
          selected afterwards, so this is a Menu rather than a Select. */}
      <Menu onOpenChange={setIsSnoozeStateModalOpen}>
        <Tooltip
          label={data.snoozed_till ? t("notification.options.mark_unsnooze") : t("notification.options.mark_snooze")}
          disabled={isMobile}
        >
          <MenuTrigger
            render={
              <button
                type="button"
                aria-label={
                  data.snoozed_till ? t("notification.options.mark_unsnooze") : t("notification.options.mark_snooze")
                }
                className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-xs bg-layer-1 outline-none hover:bg-surface-2"
                // The notification row opens the peek view on click; keep the trigger's press to itself.
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") e.stopPropagation();
                }}
              >
                <ClockOutline className="h-3 w-3 text-tertiary" />
              </button>
            }
          />
        </Tooltip>
        <MenuContent side="bottom" align="end">
          {data.snoozed_till && (
            <MenuItem
              label={t("notification.options.mark_unsnooze")}
              onClick={(e) => {
                e.stopPropagation();
                handleDropdownSelect("un-snooze");
              }}
            />
          )}

          {NOTIFICATION_SNOOZE_OPTIONS.map((option) => (
            <MenuItem
              key={option.key}
              label={t(option?.i18n_label)}
              onClick={(e) => {
                e.stopPropagation();
                handleDropdownSelect(option.value != undefined ? option.value() : option.value);
              }}
            />
          ))}
        </MenuContent>
      </Menu>
    </>
  );
});
