import { FC } from "react";
import { Controller, useForm } from "react-hook-form";
// ui
import { ToggleSwitch } from "@plane/ui";

export interface EmailPreferenceValues {
  email_notification: boolean;
  property_change: boolean;
  state_change: boolean;
  issue_completed: boolean;
  comment: boolean;
  mention: boolean;
}

export const EmailNotificationForm: FC = () => {
  // form data
  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<EmailPreferenceValues>({
    defaultValues: {
      email_notification: true,
      property_change: true,
      state_change: true,
      issue_completed: true,
      comment: true,
      mention: true,
    },
  });

  const onSubmit = async (formData: EmailPreferenceValues) => {
    console.log(formData);
  };

  return (
    <>
      <div className="flex gap-2 items-center pt-6 mb-2 pb-6 border-b border-custom-border-100">
        <div className="grow">
          <div className="pb-1 text-xl font-medium text-custom-text-100">Email notifications</div>
          <div className="text-sm font-normal text-custom-text-300">
            Get emails to find out what’s going on when you’re not on Plane. You can turn them off anytime
          </div>
        </div>
        <div className="shrink-0">
          <Controller
            control={control}
            name="email_notification"
            render={({ field: { value, onChange } }) => (
              <ToggleSwitch value={value} onChange={() => onChange(!value)} size="sm" />
            )}
          />
        </div>
      </div>
      <div className="pt-2 text-lg font-medium text-custom-text-100">Send me email notifications for:</div>
      {/* Notification Settings */}
      <div className="flex flex-col py-2">
        <div className="flex gap-2 items-center pt-6">
          <div className="grow">
            <div className="pb-1 text-base font-medium text-custom-text-100">Property changes</div>
            <div className="text-sm font-normal text-custom-text-300">
              You’ll be notified about the property changes of an issue you’re a subscriber to you.
            </div>
          </div>
          <div className="shrink-0">
            <Controller
              control={control}
              name="property_change"
              render={({ field: { value, onChange } }) => (
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => onChange(!value)}
                  className="w-3.5 h-3.5 mx-2 cursor-pointer !border-custom-border-100"
                />
              )}
            />
          </div>
        </div>
        <div className="flex gap-2 items-center pt-6 pb-2">
          <div className="grow">
            <div className="pb-1 text-base font-medium text-custom-text-100">State Change</div>
            <div className="text-sm font-normal text-custom-text-300">
              You’ll be notified about the state changes to the issues you’re a subscriber to
            </div>
          </div>
          <div className="shrink-0">
            <Controller
              control={control}
              name="state_change"
              render={({ field: { value, onChange } }) => (
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => onChange(!value)}
                  className="w-3.5 h-3.5 mx-2 cursor-pointer"
                />
              )}
            />
          </div>
        </div>
        <div className="flex gap-2 items-center border-0 border-l-[3px] border-custom-border-300 pl-3">
          <div className="grow">
            <div className="pb-1 text-base font-medium text-custom-text-100">Issue completed</div>
            <div className="text-sm font-normal text-custom-text-300">
              We’ll notify you only with the issue is moved to completed state or state group
            </div>
          </div>
          <div className="shrink-0">
            <Controller
              control={control}
              name="issue_completed"
              render={({ field: { value, onChange } }) => (
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => onChange(!value)}
                  className="w-3.5 h-3.5 mx-2 cursor-pointer"
                />
              )}
            />
          </div>
        </div>
        <div className="flex gap-2 items-center pt-6">
          <div className="grow">
            <div className="pb-1 text-base font-medium text-custom-text-100">Comments</div>
            <div className="text-sm font-normal text-custom-text-300">
              You will be notified when somebody comments on an issue you’re subscribed to
            </div>
          </div>
          <div className="shrink-0">
            <Controller
              control={control}
              name="comment"
              render={({ field: { value, onChange } }) => (
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => onChange(!value)}
                  className="w-3.5 h-3.5 mx-2 cursor-pointer"
                />
              )}
            />
          </div>
        </div>
        <div className="flex gap-2 items-center pt-6">
          <div className="grow">
            <div className="pb-1 text-base font-medium text-custom-text-100">Mentions</div>
            <div className="text-sm font-normal text-custom-text-300">
              You’ll be notified every time someone mentions you in any issue.
            </div>
          </div>
          <div className="shrink-0">
            <Controller
              control={control}
              name="mention"
              render={({ field: { value, onChange } }) => (
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => onChange(!value)}
                  className="w-3.5 h-3.5 mx-2 cursor-pointer"
                />
              )}
            />
          </div>
        </div>
      </div>
      {/* <div className="flex items-center py-12">
        <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </div> */}
    </>
  );
};
