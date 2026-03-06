/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { isEmpty } from "lodash-es";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Monitor, ShieldUser } from "lucide-react";
// plane internal packages
import { API_BASE_URL } from "@plane/constants";
import { Button, getButtonStyling } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IFormattedInstanceConfiguration, TInstanceGiteaAuthenticationConfigurationKeys } from "@plane/types";
// components
import { CodeBlock } from "@/components/common/code-block";
import { ConfirmDiscardModal } from "@/components/common/confirm-discard-modal";
import type { TControllerInputFormField } from "@/components/common/controller-input";
import { ControllerInput } from "@/components/common/controller-input";
import type { TControllerSwitchFormField } from "@/components/common/controller-switch";
import { ControllerSwitch } from "@/components/common/controller-switch";
import type { TCopyField } from "@/components/common/copy-field";
import { ServiceDetailsSection } from "@/components/authentication/service-details-section";
// hooks
import { useInstance } from "@/hooks/store";

type Props = {
  config: IFormattedInstanceConfiguration;
};

type GiteaConfigFormValues = Record<TInstanceGiteaAuthenticationConfigurationKeys, string>;

export function InstanceGiteaConfigForm(props: Props) {
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
      ENABLE_GITEA_SYNC: config["ENABLE_GITEA_SYNC"] || "0",
    },
  });

  const originURL = !isEmpty(API_BASE_URL) ? API_BASE_URL : typeof window !== "undefined" ? window.location.origin : "";

  const GITEA_FORM_FIELDS: TControllerInputFormField[] = [
    {
      key: "GITEA_HOST",
      type: "text",
      label: "Gitea Host",
      description: (
        <>Use the URL of your Gitea instance. For the official Gitea instance, use &quot;https://gitea.com&quot;.</>
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
            className="text-accent-primary hover:underline"
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
            className="text-accent-primary hover:underline"
            rel="noreferrer"
          >
            Gitea OAuth application settings.
          </a>
        </>
      ),
      placeholder: "9b0050f94ec1b744e32ce79ea4ffacd40d4119cb",
      error: Boolean(errors.GITEA_CLIENT_SECRET),
      required: true,
    },
  ];

  const GITEA_FORM_SWITCH_FIELD: TControllerSwitchFormField<GiteaConfigFormValues> = {
    name: "ENABLE_GITEA_SYNC",
    label: "Gitea",
  };

  const GITEA_SERVICE_DETAILS: TCopyField[] = [
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
            className="text-accent-primary hover:underline"
            rel="noreferrer"
          >
            here.
          </a>
        </>
      ),
    },
  ];

  const GITEA_ADMIN_SERVICE_DETAILS: TCopyField[] = [
    {
      key: "admin_callback_uri",
      label: "Callback URI",
      url: `${originURL}/api/instances/admin/gitea/callback/`,
      description: (
        <>
          We will auto-generate this. Paste this into your <CodeBlock darkerShade>Authorized Callback URI</CodeBlock>{" "}
          field{" "}
          <a
            tabIndex={-1}
            href={`${control._formValues.GITEA_HOST || "https://gitea.com"}/user/settings/applications`}
            target="_blank"
            className="text-accent-primary hover:underline"
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

    try {
      const response = await updateInstanceConfigurations(payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Done!",
        message: "Your Gitea authentication is configured. You should test it now.",
      });
      reset({
        GITEA_HOST: response.find((item) => item.key === "GITEA_HOST")?.value,
        GITEA_CLIENT_ID: response.find((item) => item.key === "GITEA_CLIENT_ID")?.value,
        GITEA_CLIENT_SECRET: response.find((item) => item.key === "GITEA_CLIENT_SECRET")?.value,
        ENABLE_GITEA_SYNC: response.find((item) => item.key === "ENABLE_GITEA_SYNC")?.value,
      });
    } catch (err) {
      console.error(err);
    }
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
            <div className="pt-2.5 text-18 font-medium">Gitea-provided details for Plane</div>
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
            <ControllerSwitch control={control} field={GITEA_FORM_SWITCH_FIELD} />
            <div className="flex flex-col gap-1 pt-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={(e) => void handleSubmit(onSubmit)(e)}
                  loading={isSubmitting}
                  disabled={!isDirty}
                >
                  {isSubmitting ? "Saving" : "Save changes"}
                </Button>
                <Link href="/authentication" className={getButtonStyling("secondary", "lg")} onClick={handleGoBack}>
                  Go back
                </Link>
              </div>
            </div>
          </div>
          <div className="col-span-2 md:col-span-1 flex flex-col gap-y-6">
            <div className="pt-2 text-18 font-medium">Plane-provided details for Gitea</div>

            <div className="flex flex-col gap-y-4">
              {/* web service details */}
              <ServiceDetailsSection icon={Monitor} title="Web" fields={GITEA_SERVICE_DETAILS} />

              {/* admin service details */}
              <ServiceDetailsSection icon={ShieldUser} title="Admin" fields={GITEA_ADMIN_SERVICE_DETAILS} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
