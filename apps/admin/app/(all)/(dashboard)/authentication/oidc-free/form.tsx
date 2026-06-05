/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { isEmpty } from "lodash-es";
import Link from "next/link";
import { useForm } from "react-hook-form";
// plane internal packages
import { API_BASE_URL } from "@plane/constants";
import { Button, getButtonStyling } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IFormattedInstanceConfiguration, TInstanceOidcFreeAuthenticationConfigurationKeys } from "@plane/types";
// components
import { CodeBlock } from "@/components/common/code-block";
import { ConfirmDiscardModal } from "@/components/common/confirm-discard-modal";
import type { TControllerInputFormField } from "@/components/common/controller-input";
import { ControllerInput } from "@/components/common/controller-input";
import type { TControllerSwitchFormField } from "@/components/common/controller-switch";
import { ControllerSwitch } from "@/components/common/controller-switch";
import type { TCopyField } from "@/components/common/copy-field";
import { CopyField } from "@/components/common/copy-field";
// hooks
import { useInstance } from "@/hooks/store";

type Props = {
  config: IFormattedInstanceConfiguration;
};

type OidcFreeConfigFormValues = Record<TInstanceOidcFreeAuthenticationConfigurationKeys, string>;

export function InstanceOidcFreeConfigForm(props: Props) {
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
  } = useForm<OidcFreeConfigFormValues>({
    defaultValues: {
      OIDC_FREE_CLIENT_ID: config["OIDC_FREE_CLIENT_ID"],
      OIDC_FREE_CLIENT_SECRET: config["OIDC_FREE_CLIENT_SECRET"],
      OIDC_FREE_HOST: config["OIDC_FREE_HOST"],
      OIDC_FREE_SCOPE: config["OIDC_FREE_SCOPE"],
      OIDC_FREE_USERINFO_URL: config["OIDC_FREE_USERINFO_URL"],
      OIDC_FREE_TOKEN_URL: config["OIDC_FREE_TOKEN_URL"],
      OIDC_FREE_CALLBACK_URI: config["OIDC_FREE_CALLBACK_URI"],
      OIDC_FREE_AUTH_URI: config["OIDC_FREE_AUTH_URI"],
      ENABLE_OIDC_FREE_SYNC: config["ENABLE_OIDC_FREE_SYNC"] || "0",
    },
  });

  const originURL = !isEmpty(API_BASE_URL) ? API_BASE_URL : typeof window !== "undefined" ? window.location.origin : "";

  const OIDC_FREE_FORM_FIELDS: TControllerInputFormField[] = [
    {
      key: "OIDC_FREE_HOST",
      type: "text",
      label: "Oidc Free Host",
      description: (
        <>Use the URL of your Oidc Free instance.</>
      ),
      placeholder: "https://<your domain>",
      error: Boolean(errors.OIDC_FREE_HOST),
      required: true,
    },
    {
      key: "OIDC_FREE_CLIENT_ID",
      type: "text",
      label: "Client ID",
      description: (
        <>
          blabla
        </>
      ),
      placeholder: "70a44354520df8bd9bcd",
      error: Boolean(errors.OIDC_FREE_CLIENT_ID),
      required: true,
    },
    {
      key: "OIDC_FREE_CLIENT_SECRET",
      type: "password",
      label: "Client secret",
      description: (
        <>
          blabla
        </>
      ),
      placeholder: "9b0050f94ec1b744e32ce79ea4ffacd40d4119cb",
      error: Boolean(errors.OIDC_FREE_CLIENT_SECRET),
      required: true,
    },

    {
      key: "OIDC_FREE_SCOPE",
      type: "text",
      label: "",
      description: (
        <>
          blabla
        </>
      ),
      placeholder: "placeholder",
      error: Boolean(errors.OIDC_FREE_SCOPE),
      required: true
    },
    {
      key: "OIDC_FREE_USERINFO_URL",
      type: "text",
      label: "",
      description: (
        <>
          blabla
        </>
      ),
      placeholder: "placeholder",
      error: Boolean(errors.OIDC_FREE_USERINFO_URL),
      required: true
    },
    {
      key: "OIDC_FREE_TOKEN_URL",
      type: "text",
      label: "",
      description: (
        <>
          blabla
        </>
      ),
      placeholder: "placeholder",
      error: Boolean(errors.OIDC_FREE_TOKEN_URL),
      required: true
    },
    {
      key: "OIDC_FREE_CALLBACK_URI",
      type: "text",
      label: "",
      description: (
        <>
          blabla
        </>
      ),
      placeholder: "placeholder",
      error: Boolean(errors.OIDC_FREE_CALLBACK_URI),
      required: true
    },
    {
      key: "OIDC_FREE_AUTH_URI",
      type: "text",
      label: "",
      description: (
        <>
          blabla
        </>
      ),
      placeholder: "placeholder",
      error: Boolean(errors.OIDC_FREE_AUTH_URI),
      required: true
    },
  ];

  const OIDC_FREE_FORM_SWITCH_FIELD: TControllerSwitchFormField<OidcFreeConfigFormValues> = {
    name: "ENABLE_OIDC_FREE_SYNC",
    label: "Oidc Free",
  };

  const OIDC_FREE_SERVICE_FIELD: TCopyField[] = [
    {
      key: "Callback_URI",
      label: "Callback URI",
      url: `${originURL}/auth/oidc-free/callback/`,
      description: (
        <>
          We will auto-generate this.
        </>
      ),
    },
  ];

  const onSubmit = async (formData: OidcFreeConfigFormValues) => {
    const payload: Partial<OidcFreeConfigFormValues> = { ...formData };

    try {
      const response = await updateInstanceConfigurations(payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Done!",
        message: "Your Oidc Free authentication is configured. You should test it now.",
      });
      reset({
        OIDC_FREE_CLIENT_ID: response.find((item) => item.key === "OIDC_FREE_CLIENT_ID")?.value,
        OIDC_FREE_CLIENT_SECRET: response.find((item) => item.key === "OIDC_FREE_CLIENT_SECRET")?.value,
        OIDC_FREE_HOST: response.find((item) => item.key === "OIDC_FREE_HOST")?.value,
        OIDC_FREE_SCOPE: response.find((item) => item.key === "OIDC_FREE_SCOPE")?.value,
        OIDC_FREE_USERINFO_URL: response.find((item) => item.key === "OIDC_FREE_USERINFO_URL")?.value,
        OIDC_FREE_TOKEN_URL: response.find((item) => item.key === "OIDC_FREE_TOKEN_URL")?.value,
        OIDC_FREE_CALLBACK_URI: response.find((item) => item.key === "OIDC_FREE_CALLBACK_URI")?.value,
        OIDC_FREE_AUTH_URI: response.find((item) => item.key === "OIDC_FREE_AUTH_URI")?.value,
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
        <div className="grid w-full grid-cols-2 gap-x-12 gap-y-8">
          <div className="col-span-2 flex flex-col gap-y-4 pt-1 md:col-span-1">
            <div className="pt-2.5 text-18 font-medium">Oidc Free-provided details for Plane</div>
            {OIDC_FREE_FORM_FIELDS.map((field) => (
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
            <ControllerSwitch control={control} field={OIDC_FREE_FORM_SWITCH_FIELD} />
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
          <div className="col-span-2 md:col-span-1">
            <div className="flex flex-col gap-y-4 rounded-lg bg-layer-1 px-6 pt-1.5 pb-4">
              <div className="pt-2 text-18 font-medium">Plane-provided details for Oidc Free</div>
              {OIDC_FREE_SERVICE_FIELD.map((field) => (
                <CopyField key={field.key} label={field.label} url={field.url} description={field.description} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
