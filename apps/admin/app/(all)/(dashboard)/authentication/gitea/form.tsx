"use client";

import { FC, useState } from "react";
import isEmpty from "lodash/isEmpty";
import Link from "next/link";
import { useForm } from "react-hook-form";
// plane internal packages
import { API_BASE_URL } from "@plane/constants";
import { IFormattedInstanceConfiguration, TInstanceGiteaAuthenticationConfigurationKeys } from "@plane/types";
import { Button, TOAST_TYPE, getButtonStyling, setToast } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { CodeBlock } from "@/components/common/code-block";
import { ConfirmDiscardModal } from "@/components/common/confirm-discard-modal";
import { ControllerInput, TControllerInputFormField } from "@/components/common/controller-input";
import { CopyField, TCopyField } from "@/components/common/copy-field";
// hooks
import { useInstance } from "@/hooks/store";

type Props = {
  config: IFormattedInstanceConfiguration;
};

type GiteaConfigFormValues = Record<TInstanceGiteaAuthenticationConfigurationKeys, string>;

export const InstanceGiteaConfigForm: FC<Props> = (props) => {
  const { config } = props;
  // states
  const [isDiscardChangesModalOpen, setIsDiscardChangesModalOpen] = useState(false);
  // store hooks
  const { updateInstanceConfigurations } = useInstance();
  // form data
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<GiteaConfigFormValues>({
    defaultValues: {
      GITEA_HOST: config["GITEA_HOST"] || "https://gitea.com",
      GITEA_CLIENT_ID: config["GITEA_CLIENT_ID"],
      GITEA_CLIENT_SECRET: config["GITEA_CLIENT_SECRET"],
    },
  });

  const originURL = !isEmpty(API_BASE_URL) ? API_BASE_URL : typeof window !== "undefined" ? window.location.origin : "";

  const GITEA_FORM_FIELDS: TControllerInputFormField[] = [
    {
      key: "GITEA_HOST", 
      type: "text",
      label: "Gitea Host",
      description: (
        <>Use the URL of your Gitea instance. For the official Gitea instance, use "https://gitea.com".</>
      ),
      placeholder: "https://gitea.com",
      error: Boolean(errors.GITEA_HOST),
      required: true,
    },
    {
      key: "GITEA_CLIENT_ID", 
      type: "text",
      label: "Client ID",
      description: (
        <>
          You will get this from your{" "}
          <a
            tabIndex={-1}
            href="https://gitea.com/user/settings/applications"
            target="_blank"
            className="text-custom-primary-100 hover:underline"
            rel="noreferrer"
          >
            Gitea OAuth application settings.
          </a>
        </>
      ),
      placeholder: "70a44354520df8bd9bcd",
      error: Boolean(errors.GITEA_CLIENT_ID),
      required: true,
    },
    {
      key: "GITEA_CLIENT_SECRET",
      type: "password",
      label: "Client secret",
      description: (
        <>
          Your client secret is also found in your{" "}
          <a
            tabIndex={-1}
            href="https://gitea.com/user/settings/applications"
            target="_blank"
            className="text-custom-primary-100 hover:underline"
            rel="noreferrer"
          >
            Gitea OAuth application settings.
          </a>
        </>
      ),
      placeholder: "9b0050f94ec1b744e32ce79ea4ffacd40d4119cb",
      error: Boolean(errors.GITEA_CLIENT_SECRET),
      required: true,
    }
  ];

  const GITEA_SERVICE_FIELD: TCopyField[] = [
    {
      key: "Callback_URI",
      label: "Callback URI",
      url: `${originURL}/auth/gitea/callback/`,
      description: (
        <>
          We will auto-generate this. Paste this into your <CodeBlock darkerShade>Authorized Callback URI</CodeBlock>{" "}
          field{" "}
          <a
            tabIndex={-1}
            href={`${control._formValues.GITEA_HOST || "https://gitea.com"}/user/settings/applications`}
            target="_blank"
            className="text-custom-primary-100 hover:underline"
            rel="noreferrer"
          >
            here.
          </a>
        </>
      ),
    },
  ];

  const onSubmit = async (formData: GiteaConfigFormValues) => {
    const payload: Partial<GiteaConfigFormValues> = { ...formData };

    await updateInstanceConfigurations(payload)
      .then((response = []) => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Done!",
          message: "Your Gitea authentication is configured. You should test it now.",
        });
        reset({
          GITEA_CLIENT_ID: response.find((item) => item.key === "GITEA_CLIENT_ID")?.value,
          GITEA_CLIENT_SECRET: response.find((item) => item.key === "GITEA_CLIENT_SECRET")?.value,    
        });
      })
      .catch((err) => console.error(err));
  };

  const handleGoBack = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (isDirty) {
      e.preventDefault();
      setIsDiscardChangesModalOpen(true);
    }
  };

  return (
    <>
      <ConfirmDiscardModal
        isOpen={isDiscardChangesModalOpen}
        onDiscardHref="/authentication"
        handleClose={() => setIsDiscardChangesModalOpen(false)}
      />
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-2 gap-x-12 gap-y-8 w-full">
          <div className="flex flex-col gap-y-4 col-span-2 md:col-span-1 pt-1">
            <div className="pt-2.5 text-xl font-medium">Gitea-provided details for Plane</div>
            {GITEA_FORM_FIELDS.map((field) => (
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
            <div className="flex flex-col gap-1 pt-4">
              <div className="flex items-center gap-4">
                <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting} disabled={!isDirty}>
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
                <Link
                  href="/authentication"
                  className={cn(getButtonStyling("neutral-primary", "md"), "font-medium")}
                  onClick={handleGoBack}
                >
                  Go back
                </Link>
              </div>
            </div>
          </div>
          <div className="col-span-2 md:col-span-1">
            <div className="flex flex-col gap-y-4 px-6 pt-1.5 pb-4 bg-custom-background-80/60 rounded-lg">
              <div className="pt-2 text-xl font-medium">Plane-provided details for Gitea</div>
              {GITEA_SERVICE_FIELD.map((field) => (
                <CopyField key={field.key} label={field.label} url={field.url} description={field.description} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
