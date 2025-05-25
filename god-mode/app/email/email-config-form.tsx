"use client";

import React, { FC, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
// types
import { IFormattedInstanceConfiguration, TInstanceEmailConfigurationKeys } from "@plane/types";
// ui
import { Button, CustomSelect, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { ControllerInput, TControllerInputFormField } from "@/components/common";
// hooks
import { useInstance } from "@/hooks/store";
// local components
import { SendTestEmailModal } from "./test-email-modal";

type IInstanceEmailForm = {
  config: IFormattedInstanceConfiguration;
};

type EmailFormValues = Record<TInstanceEmailConfigurationKeys, string>;

type TEmailSecurityKeys = "EMAIL_USE_TLS" | "EMAIL_USE_SSL" | "NONE";

const EMAIL_SECURITY_OPTIONS: { [key in TEmailSecurityKeys]: string } = {
  EMAIL_USE_TLS: "TLS",
  EMAIL_USE_SSL: "SSL",
  NONE: "No email security",
};

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
    setValue,
    control,
    formState: { errors, isValid, isDirty, isSubmitting },
  } = useForm<EmailFormValues>({
    defaultValues: {
      EMAIL_HOST: config["EMAIL_HOST"],
      EMAIL_PORT: config["EMAIL_PORT"],
      EMAIL_HOST_USER: config["EMAIL_HOST_USER"],
      EMAIL_HOST_PASSWORD: config["EMAIL_HOST_PASSWORD"],
      EMAIL_USE_TLS: config["EMAIL_USE_TLS"],
      EMAIL_USE_SSL: config["EMAIL_USE_SSL"],
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
      key: "EMAIL_FROM",
      type: "text",
      label: "Sender's email address",
      description:
        "This is the email address your users will see when getting emails from this instance. You will need to verify this address.",
      placeholder: "no-reply@projectplane.so",
      error: Boolean(errors.EMAIL_FROM),
      required: true,
    },
  ];

  const OptionalEmailFormFields: TControllerInputFormField[] = [
    {
      key: "EMAIL_HOST_USER",
      type: "text",
      label: "Username",
      placeholder: "getitdone@projectplane.so",
      error: Boolean(errors.EMAIL_HOST_USER),
      required: false,
    },
    {
      key: "EMAIL_HOST_PASSWORD",
      type: "password",
      label: "Password",
      placeholder: "Password",
      error: Boolean(errors.EMAIL_HOST_PASSWORD),
      required: false,
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

  const useTLSValue = watch("EMAIL_USE_TLS");
  const useSSLValue = watch("EMAIL_USE_SSL");
  const emailSecurityKey: TEmailSecurityKeys = useMemo(() => {
    if (useTLSValue === "1") return "EMAIL_USE_TLS";
    if (useSSLValue === "1") return "EMAIL_USE_SSL";
    return "NONE";
  }, [useTLSValue, useSSLValue]);

  const handleEmailSecurityChange = (key: TEmailSecurityKeys) => {
    if (key === "EMAIL_USE_SSL") {
      setValue("EMAIL_USE_TLS", "0");
      setValue("EMAIL_USE_SSL", "1");
    }
    if (key === "EMAIL_USE_TLS") {
      setValue("EMAIL_USE_TLS", "1");
      setValue("EMAIL_USE_SSL", "0");
    }
    if (key === "NONE") {
      setValue("EMAIL_USE_TLS", "0");
      setValue("EMAIL_USE_SSL", "0");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <SendTestEmailModal isOpen={isSendTestEmailModalOpen} handleClose={() => setIsSendTestEmailModalOpen(false)} />
        <div className="grid-col grid w-full max-w-4xl grid-cols-1 items-start justify-between gap-10 lg:grid-cols-2">
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
          <div className="flex flex-col gap-1">
            <h4 className="text-sm text-custom-text-300">Email security</h4>
            <CustomSelect
              value={emailSecurityKey}
              label={EMAIL_SECURITY_OPTIONS[emailSecurityKey]}
              onChange={handleEmailSecurityChange}
              buttonClassName="rounded-md border-custom-border-200"
              optionsClassName="w-full"
              input
            >
              {Object.entries(EMAIL_SECURITY_OPTIONS).map(([key, value]) => (
                <CustomSelect.Option key={key} value={key} className="w-full">
                  {value}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          </div>
        </div>
        <div className="flex flex-col gap-6 my-6 pt-4 border-t border-custom-border-100">
          <div className="flex w-full max-w-xl flex-col gap-y-10 px-1">
            <div className="mr-8 flex items-center gap-10 pt-4">
              <div className="grow">
                <div className="text-sm font-medium text-custom-text-100">Authentication</div>
                <div className="text-xs font-normal text-custom-text-300">
                  This is optional, but we recommend setting up a username and a password for your SMTP server.
                </div>
              </div>
            </div>
          </div>
          <div className="grid-col grid w-full max-w-4xl grid-cols-1 items-center justify-between gap-10 lg:grid-cols-2">
            {OptionalEmailFormFields.map((field) => (
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
        </div>
      </div>
      <div className="flex max-w-4xl items-center py-1 gap-4">
        <Button
          variant="primary"
          onClick={handleSubmit(onSubmit)}
          loading={isSubmitting}
          disabled={!isValid || !isDirty}
        >
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
        <Button
          variant="outline-primary"
          onClick={() => setIsSendTestEmailModalOpen(true)}
          loading={isSubmitting}
          disabled={!isValid}
        >
          Send test email
        </Button>
      </div>
    </div>
  );
};
