"use client";

import React, { FC, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { IUserEmailNotificationSettings } from "@plane/types";
// ui
import { ToggleSwitch, TOAST_TYPE, setToast } from "@plane/ui";
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
  // form data
  const {
    control,
    reset,
  } = useForm<IUserEmailNotificationSettings>({
    defaultValues: {
      ...data,
    },
  });

  const handleSettingChange = async (key: keyof IUserEmailNotificationSettings, value: boolean) => {
    try {
      await userService.updateCurrentUserEmailNotificationSettings({
        [key]: value,
      });
      setToast({
        title: "Success!",
        type: TOAST_TYPE.SUCCESS,
        message: "Email notification setting updated successfully",
      });
    } catch (err) {
      console.error(err);
      setToast({
        title: "Error!",
        type: TOAST_TYPE.ERROR,
        message: "Failed to update email notification setting",
      });
    }
  };

  useEffect(() => {
    reset(data);
  }, [reset, data]);

  return (
    <>
      <div className="pt-6 text-lg font-medium text-custom-text-100">Notify me when:</div>
      {/* Notification Settings */}
      <div className="flex flex-col py-2">
        <div className="flex gap-2 items-center pt-6">
          <div className="grow">
            <div className="pb-1 text-base font-medium text-custom-text-100">Property changes</div>
            <div className="text-sm font-normal text-custom-text-300">
              Notify me when issue's properties like assignees, priority, estimates or anything else changes.
            </div>
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
            <div className="pb-1 text-base font-medium text-custom-text-100">State change</div>
            <div className="text-sm font-normal text-custom-text-300">
              Notify me when the issues moves to a different state
            </div>
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
            <div className="pb-1 text-base font-medium text-custom-text-100">Issue completed</div>
            <div className="text-sm font-normal text-custom-text-300">Notify me only when an issue is completed</div>
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
            <div className="pb-1 text-base font-medium text-custom-text-100">Comments</div>
            <div className="text-sm font-normal text-custom-text-300">
              Notify me when someone leaves a comment on the issue
            </div>
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
            <div className="pb-1 text-base font-medium text-custom-text-100">Mentions</div>
            <div className="text-sm font-normal text-custom-text-300">
              Notify me only when someone mentions me in the comments or description
            </div>
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
