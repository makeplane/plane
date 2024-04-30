import { FC, useState } from "react";
import { Controller, useForm } from "react-hook-form";
// hooks
import { useInstance } from "@/hooks";
// ui
import { Button, TOAST_TYPE, ToggleSwitch, setToast } from "@plane/ui";
// components
import { ControllerInput, TControllerInputFormField } from "components/common";
import { SendTestEmailModal } from "./test-email-modal";
// types
import { IFormattedInstanceConfiguration, TInstanceEmailConfigurationKeys } from "@plane/types";

type IInstanceEmailForm = {
  config: IFormattedInstanceConfiguration;
};

type EmailFormValues = Record<TInstanceEmailConfigurationKeys, string>;

export const InstanceEmailForm: FC<IInstanceEmailForm> = (props) => {
  const { config } = props;
  // states
  const [isSendTestEmailModalOpen, setIsSendTestEmailModalOpen] = useState(false);
  // store hooks
  const { updateInstanceConfigurations } = useInstance();
  // form data
  const {
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EmailFormValues>({
    defaultValues: {
      EMAIL_HOST: config["EMAIL_HOST"],
      EMAIL_PORT: config["EMAIL_PORT"],
      EMAIL_HOST_USER: config["EMAIL_HOST_USER"],
      EMAIL_HOST_PASSWORD: config["EMAIL_HOST_PASSWORD"],
      EMAIL_USE_TLS: config["EMAIL_USE_TLS"],
      // EMAIL_USE_SSL: config["EMAIL_USE_SSL"],
      EMAIL_FROM: config["EMAIL_FROM"],
    },
  });

  const emailFormFields: TControllerInputFormField[] = [
    {
      key: "EMAIL_HOST",
      type: "text",
      label: "Host",
      placeholder: "email.google.com",
      error: Boolean(errors.EMAIL_HOST),
      required: true,
    },
    {
      key: "EMAIL_PORT",
      type: "text",
      label: "Port",
      placeholder: "8080",
      error: Boolean(errors.EMAIL_PORT),
      required: true,
    },
    {
      key: "EMAIL_HOST_USER",
      type: "text",
      label: "Username",
      placeholder: "getitdone@projectplane.so",
      error: Boolean(errors.EMAIL_HOST_USER),
      required: true,
    },
    {
      key: "EMAIL_HOST_PASSWORD",
      type: "password",
      label: "Password",
      placeholder: "Password",
      error: Boolean(errors.EMAIL_HOST_PASSWORD),
      required: true,
    },
    {
      key: "EMAIL_FROM",
      type: "text",
      label: "From address",
      description:
        "This is the email address your users will see when getting emails from this instance. You will need to verify this address.",
      placeholder: "no-reply@projectplane.so",
      error: Boolean(errors.EMAIL_FROM),
      required: true,
    },
  ];

  const onSubmit = async (formData: EmailFormValues) => {
    const payload: Partial<EmailFormValues> = { ...formData };

    await updateInstanceConfigurations(payload)
      .then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success",
          message: "Email Settings updated successfully",
        })
      )
      .catch((err) => console.error(err));
  };

  return (
    <div className="space-y-8">
      <div>
        <SendTestEmailModal isOpen={isSendTestEmailModalOpen} handleClose={() => setIsSendTestEmailModalOpen(false)} />
        <div className="grid-col grid w-full max-w-4xl grid-cols-1 items-center justify-between gap-x-20 gap-y-10 lg:grid-cols-2">
          {emailFormFields.map((field) => (
            <ControllerInput
              key={field.key}
              control={control}
              type={field.type}
              name={field.key}
              label={field.label}
              description={field.description}
              placeholder={field.placeholder}
              error={field.error}
              required={field.required}
            />
          ))}
        </div>
        <div className="flex w-full max-w-md flex-col gap-y-10 px-1">
          <div className="mr-8 flex items-center gap-10 pt-4">
            <div className="grow">
              <div className="text-sm font-medium text-custom-text-100">
                Turn TLS {Boolean(parseInt(watch("EMAIL_USE_TLS"))) ? "off" : "on"}
              </div>
              <div className="text-xs font-normal text-custom-text-300">
                Use this if your email domain supports TLS.
              </div>
            </div>
            <div className="shrink-0">
              <Controller
                control={control}
                name="EMAIL_USE_TLS"
                render={({ field: { value, onChange } }) => (
                  <ToggleSwitch
                    value={Boolean(parseInt(value))}
                    onChange={() => {
                      Boolean(parseInt(value)) === true ? onChange("0") : onChange("1");
                    }}
                    size="sm"
                  />
                )}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex max-w-4xl items-center py-1 gap-4">
        <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
        <Button variant="outline-primary" onClick={() => setIsSendTestEmailModalOpen(true)} loading={isSubmitting}>
          Send test email
        </Button>
      </div>
    </div>
  );
};
