import React, { FC, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
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
  // form data
  const {
    handleSubmit,
    watch,
    control,
    setValue,
    reset,
    formState: { isSubmitting, isDirty, dirtyFields },
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
          title: "Success!",
          type: TOAST_TYPE.SUCCESS,
          message: "Email Notification Settings updated successfully",
        })
      )
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    reset(data);
  }, [reset, data]);

  return (
    <>
      <div className="flex gap-2 items-center pt-6 mb-2 pb-6 border-b border-custom-border-100">
        <div className="grow">
          <div className="pb-1 text-xl font-medium text-custom-text-100">Email notifications</div>
          <div className="text-sm font-normal text-custom-text-300">
            Stay in the loop on Issues you are subscribed to. Enable this to get notified.
          </div>
        </div>
      </div>
      <div className="pt-2 text-lg font-medium text-custom-text-100">Notify me when:</div>
      {/* Notification Settings */}
      <div className="flex flex-col py-2">
        <div className="flex gap-2 items-center pt-6">
          <div className="grow">
            <div className="pb-1 text-base font-medium text-custom-text-100">Property changes</div>
            <div className="text-sm font-normal text-custom-text-300">
              Notify me when issue’s properties like assignees, priority, estimates or anything else changes.
            </div>
          </div>
          <div className="shrink-0">
            <Controller
              control={control}
              name="property_change"
              render={({ field: { value, onChange } }) => (
                <Checkbox checked={value} onChange={() => onChange(!value)} className="mx-2" />
              )}
            />
          </div>
        </div>
        <div className="flex gap-2 items-center pt-6 pb-2">
          <div className="grow">
            <div className="pb-1 text-base font-medium text-custom-text-100">State Change</div>
            <div className="text-sm font-normal text-custom-text-300">
              Notify me when the issues moves to a different state
            </div>
          </div>
          <div className="shrink-0">
            <Controller
              control={control}
              name="state_change"
              render={({ field: { value, onChange } }) => (
                <Checkbox
                  checked={value}
                  intermediate={!value && watch("issue_completed")}
                  onChange={() => {
                    setValue("issue_completed", !value);
                    onChange(!value);
                  }}
                  className="mx-2"
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
                <Checkbox checked={value} onChange={() => onChange(!value)} className="mx-2" />
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
                <Checkbox checked={value} onChange={() => onChange(!value)} className="mx-2" />
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
                <Checkbox checked={value} onChange={() => onChange(!value)} className="mx-2" />
              )}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center py-12">
        <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting} disabled={!isDirty}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </>
  );
};
