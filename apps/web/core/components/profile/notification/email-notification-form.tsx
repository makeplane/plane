"use client";

import React, { FC, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { PROFILE_SETTINGS_TRACKER_ELEMENTS, PROFILE_SETTINGS_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IUserEmailNotificationSettings } from "@plane/types";
// ui
import { ToggleSwitch, TOAST_TYPE, setToast } from "@plane/ui";
// services
import { captureClick, captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { UserService } from "@/services/user.service";
// types
interface IEmailNotificationFormProps {
  data: IUserEmailNotificationSettings;
}

// services
const userService = new UserService();

export const EmailNotificationForm: FC<IEmailNotificationFormProps> = (props) => {
  const { data } = props;
  const { t } = useTranslation();
  // form data
  const { control, reset } = useForm<IUserEmailNotificationSettings>({
    defaultValues: {
      ...data,
    },
  });

  const handleSettingChange = async (key: keyof IUserEmailNotificationSettings, value: boolean) => {
    try {
      await userService.updateCurrentUserEmailNotificationSettings({
        [key]: value,
      });
      captureSuccess({
        eventName: PROFILE_SETTINGS_TRACKER_EVENTS.notifications_updated,
        payload: {
          [key]: value,
        },
      });
      setToast({
        title: t("success"),
        type: TOAST_TYPE.SUCCESS,
        message: t("email_notification_setting_updated_successfully"),
      });
    } catch (err) {
      console.error(err);
      captureError({
        eventName: PROFILE_SETTINGS_TRACKER_EVENTS.notifications_updated,
        payload: {
          [key]: value,
        },
      });
      setToast({
        title: t("error"),
        type: TOAST_TYPE.ERROR,
        message: t("failed_to_update_email_notification_setting"),
      });
    }
  };

  useEffect(() => {
    reset(data);
  }, [reset, data]);

  return (
    <>
      {/* Notification Settings */}
      <div className="flex flex-col py-2 w-full">
        <div className="flex gap-2 items-center pt-2">
          <div className="grow">
            <div className="pb-1 text-base font-medium text-custom-text-100">{t("property_changes")}</div>
            <div className="text-sm font-normal text-custom-text-300">{t("property_changes_description")}</div>
          </div>
          <div className="shrink-0">
            <Controller
              control={control}
              name="property_change"
              render={({ field: { value, onChange } }) => (
                <ToggleSwitch
                  value={value}
                  onChange={(newValue) => {
                    onChange(newValue);
                    captureClick({
                      elementName: PROFILE_SETTINGS_TRACKER_ELEMENTS.PROPERTY_CHANGES_TOGGLE,
                    });
                    handleSettingChange("property_change", newValue);
                  }}
                  size="sm"
                />
              )}
            />
          </div>
        </div>
        <div className="flex gap-2 items-center pt-6 pb-2">
          <div className="grow">
            <div className="pb-1 text-base font-medium text-custom-text-100">{t("state_change")}</div>
            <div className="text-sm font-normal text-custom-text-300">{t("state_change_description")}</div>
          </div>
          <div className="shrink-0">
            <Controller
              control={control}
              name="state_change"
              render={({ field: { value, onChange } }) => (
                <ToggleSwitch
                  value={value}
                  onChange={(newValue) => {
                    onChange(newValue);
                    captureClick({
                      elementName: PROFILE_SETTINGS_TRACKER_ELEMENTS.STATE_CHANGES_TOGGLE,
                    });
                    handleSettingChange("state_change", newValue);
                  }}
                  size="sm"
                />
              )}
            />
          </div>
        </div>
        <div className="flex gap-2 items-center border-0 border-l-[3px] border-custom-border-300 pl-3">
          <div className="grow">
            <div className="pb-1 text-base font-medium text-custom-text-100">{t("issue_completed")}</div>
            <div className="text-sm font-normal text-custom-text-300">{t("issue_completed_description")}</div>
          </div>
          <div className="shrink-0">
            <Controller
              control={control}
              name="issue_completed"
              render={({ field: { value, onChange } }) => (
                <ToggleSwitch
                  value={value}
                  onChange={(newValue) => {
                    onChange(newValue);
                    handleSettingChange("issue_completed", newValue);
                  }}
                  size="sm"
                />
              )}
            />
          </div>
        </div>
        <div className="flex gap-2 items-center pt-6">
          <div className="grow">
            <div className="pb-1 text-base font-medium text-custom-text-100">{t("comments")}</div>
            <div className="text-sm font-normal text-custom-text-300">{t("comments_description")}</div>
          </div>
          <div className="shrink-0">
            <Controller
              control={control}
              name="comment"
              render={({ field: { value, onChange } }) => (
                <ToggleSwitch
                  value={value}
                  onChange={(newValue) => {
                    onChange(newValue);
                    captureClick({
                      elementName: PROFILE_SETTINGS_TRACKER_ELEMENTS.COMMENTS_TOGGLE,
                    });
                    handleSettingChange("comment", newValue);
                  }}
                  size="sm"
                />
              )}
            />
          </div>
        </div>
        <div className="flex gap-2 items-center pt-6">
          <div className="grow">
            <div className="pb-1 text-base font-medium text-custom-text-100">{t("mentions")}</div>
            <div className="text-sm font-normal text-custom-text-300">{t("mentions_description")}</div>
          </div>
          <div className="shrink-0">
            <Controller
              control={control}
              name="mention"
              render={({ field: { value, onChange } }) => (
                <ToggleSwitch
                  value={value}
                  onChange={(newValue) => {
                    onChange(newValue);
                    captureClick({
                      elementName: PROFILE_SETTINGS_TRACKER_ELEMENTS.MENTIONS_TOGGLE,
                    });
                    handleSettingChange("mention", newValue);
                  }}
                  size="sm"
                />
              )}
            />
          </div>
        </div>
      </div>
    </>
  );
};
