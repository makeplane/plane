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
import type { IFormattedInstanceConfiguration, TInstanceKeycloakAuthenticationConfigurationKeys } from "@plane/types";
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

type KeycloakConfigFormValues = Record<TInstanceKeycloakAuthenticationConfigurationKeys, string>;

export function InstanceKeycloakConfigForm(props: Props) {
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
  } = useForm<KeycloakConfigFormValues>({
    defaultValues: {
      KEYCLOAK_HOST: config["KEYCLOAK_HOST"] || "",
      KEYCLOAK_REALM: config["KEYCLOAK_REALM"] || "",
      KEYCLOAK_CLIENT_ID: config["KEYCLOAK_CLIENT_ID"],
      KEYCLOAK_CLIENT_SECRET: config["KEYCLOAK_CLIENT_SECRET"],
      ENABLE_KEYCLOAK_SYNC: config["ENABLE_KEYCLOAK_SYNC"] || "0",
    },
  });

  const originURL = !isEmpty(API_BASE_URL) ? API_BASE_URL : typeof window !== "undefined" ? window.location.origin : "";

  const KEYCLOAK_FORM_FIELDS: TControllerInputFormField[] = [
    {
      key: "KEYCLOAK_HOST",
      type: "text",
      label: "Keycloak Host",
      placeholder: "https://keycloak.example.com",
      error: Boolean(errors.KEYCLOAK_HOST),
      required: true,
    },
    {
      key: "KEYCLOAK_REALM",
      type: "text",
      label: "Realm",
      description: <>The Keycloak realm to authenticate against.</>,
      placeholder: "master",
      error: Boolean(errors.KEYCLOAK_REALM),
      required: true,
    },
    {
      key: "KEYCLOAK_CLIENT_ID",
      type: "text",
      label: "Client ID",
      description: <>You will get this from your Keycloak admin console.</>,
      placeholder: "plane",
      error: Boolean(errors.KEYCLOAK_CLIENT_ID),
      required: true,
    },
    {
      key: "KEYCLOAK_CLIENT_SECRET",
      type: "password",
      label: "Client Secret",
      description: <>Your client secret is found in your Keycloak admin console.</>,
      placeholder: "••••••••••••••••••••••••••••••••",
      error: Boolean(errors.KEYCLOAK_CLIENT_SECRET),
      required: true,
    },
  ];

  const KEYCLOAK_FORM_SWITCH_FIELD: TControllerSwitchFormField<KeycloakConfigFormValues> = {
    name: "ENABLE_KEYCLOAK_SYNC",
    label: "Keycloak",
  };

  const KEYCLOAK_SERVICE_FIELD: TCopyField[] = [
    {
      key: "Callback_URI",
      label: "Callback URI",
      url: `${originURL}/auth/keycloak/callback/`,
      description: (
        <>
          We will auto-generate this. Paste this into your <CodeBlock darkerShade>Valid Redirect URIs</CodeBlock> field
          in your Keycloak client settings.
        </>
      ),
    },
  ];

  const onSubmit = async (formData: KeycloakConfigFormValues) => {
    const payload: Partial<KeycloakConfigFormValues> = { ...formData };

    try {
      const response = await updateInstanceConfigurations(payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Done!",
        message: "Your Keycloak authentication is configured. You should test it now.",
      });
      reset({
        KEYCLOAK_HOST: response.find((item) => item.key === "KEYCLOAK_HOST")?.value,
        KEYCLOAK_REALM: response.find((item) => item.key === "KEYCLOAK_REALM")?.value,
        KEYCLOAK_CLIENT_ID: response.find((item) => item.key === "KEYCLOAK_CLIENT_ID")?.value,
        KEYCLOAK_CLIENT_SECRET: response.find((item) => item.key === "KEYCLOAK_CLIENT_SECRET")?.value,
        ENABLE_KEYCLOAK_SYNC: response.find((item) => item.key === "ENABLE_KEYCLOAK_SYNC")?.value,
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
            <div className="pt-2.5 text-18 font-medium">Keycloak-provided details for Plane</div>
            {KEYCLOAK_FORM_FIELDS.map((field) => (
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
            <ControllerSwitch control={control} field={KEYCLOAK_FORM_SWITCH_FIELD} />
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
              <div className="pt-2 text-18 font-medium">Plane-provided details for Keycloak</div>
              {KEYCLOAK_SERVICE_FIELD.map((field) => (
                <CopyField key={field.key} label={field.label} url={field.url} description={field.description} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
