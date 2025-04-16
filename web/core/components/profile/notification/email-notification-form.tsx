"use client";

import React, { FC, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { IUserEmailNotificationSettings } from "@plane/types";
// ui
import { Button, Checkbox, TOAST_TYPE, setToast } from "@plane/ui";
// services
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
  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting, dirtyFields },
  } = useForm<IUserEmailNotificationSettings>({
    defaultValues: {
      ...data,
    },
  });

  const onSubmit = async (formData: IUserEmailNotificationSettings) => {
    // Get the dirty fields from the form data and create a payload
    let payload = {};
    Object.keys(dirtyFields).forEach((key) => {
      payload = {
        ...payload,
        [key]: formData[key as keyof IUserEmailNotificationSettings],
      };
    });
    await userService
      .updateCurrentUserEmailNotificationSettings(payload)
      .then(() =>
        setToast({
          title: t("success"),
          type: TOAST_TYPE.SUCCESS,
          message: t("email_notification_setting_updated_successfully"),
        })
      )
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    reset(data);
  }, [reset, data]);

  return (
    <>
      <div className="pt-6 text-lg font-medium text-custom-text-100">{t("notify_me_when")}:</div>
      {/* Notification Settings */}
      <div className="flex flex-col py-2">
        <div className="flex gap-2 items-center pt-6">
          <div className="grow">
            <div className="pb-1 text-base font-medium text-custom-text-100">{t("property_changes")}</div>
            <div className="text-sm font-normal text-custom-text-300">{t("property_changes_description")}</div>
          </div>
          <div className="shrink-0">
            <Controller
              control={control}
              name="property_change"
              render={({ field: { value, onChange } }) => (
                <Checkbox checked={value} onChange={() => onChange(!value)} containerClassName="mx-2" />
              )}
            />
          </div>
        </div>
        <div className="flex gap-2 items-center pt-6 pb-2">
          <div className="grow">
            <div className="pb-1 text-base font-medium text-custom-text-100">{t("state_change")}</div>
            <div className="text-sm font-normal text-custom-text-300">
              {t("state_change_description")}
            </div>
          </div>
          <div className="shrink-0">
            <Controller
              control={control}
              name="state_change"
              render={({ field: { value, onChange } }) => (
                <Checkbox
                  checked={value}
                  onChange={() => {
                    onChange(!value);
                  }}
                  containerClassName="mx-2"
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
                <Checkbox checked={value} onChange={() => onChange(!value)} containerClassName="mx-2" />
              )}
            />
          </div>
        </div>
        <div className="flex gap-2 items-center pt-6">
          <div className="grow">
            <div className="pb-1 text-base font-medium text-custom-text-100">{t("comments")}</div>
            <div className="text-sm font-normal text-custom-text-300">
              {t("comments_description")}
            </div>
          </div>
          <div className="shrink-0">
            <Controller
              control={control}
              name="comment"
              render={({ field: { value, onChange } }) => (
                <Checkbox checked={value} onChange={() => onChange(!value)} containerClassName="mx-2" />
              )}
            />
          </div>
        </div>
        <div className="flex gap-2 items-center pt-6">
          <div className="grow">
            <div className="pb-1 text-base font-medium text-custom-text-100">{t("mentions")}</div>
            <div className="text-sm font-normal text-custom-text-300">
              {t("mentions_description")}
            </div>
          </div>
          <div className="shrink-0">
            <Controller
              control={control}
              name="mention"
              render={({ field: { value, onChange } }) => (
                <Checkbox checked={value} onChange={() => onChange(!value)} containerClassName="mx-2" />
              )}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center py-12">
        <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </>
  );
};