/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { isEmpty } from "lodash-es";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
// plane internal packages
import { API_BASE_URL } from "@plane/constants";
import { Button } from "@makeplane/propel/components/button";
import { Switch } from "@makeplane/propel/components/switch";
import { TOAST_TYPE, setToast } from "@/providers/toast";
import type { IFormattedInstanceConfiguration, TInstanceOIDCAuthenticationConfigurationKeys } from "@plane/types";
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

type OIDCConfigFormValues = Record<TInstanceOIDCAuthenticationConfigurationKeys, string>;

const OIDC_SYNC_SWITCH_FIELD: TControllerSwitchFormField<OIDCConfigFormValues> = {
  name: "ENABLE_OIDC_SYNC",
  label: "OpenID Connect",
};

export function InstanceOIDCConfigForm(props: Props) {
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
  } = useForm<OIDCConfigFormValues>({
    defaultValues: {
      OIDC_DISPLAY_NAME: config["OIDC_DISPLAY_NAME"] || "SSO",
      OIDC_ISSUER_URL: config["OIDC_ISSUER_URL"],
      OIDC_CLIENT_ID: config["OIDC_CLIENT_ID"],
      OIDC_CLIENT_SECRET: config["OIDC_CLIENT_SECRET"],
      OIDC_REQUIRE_EMAIL_VERIFIED: config["OIDC_REQUIRE_EMAIL_VERIFIED"] || "0",
      ENABLE_OIDC_SYNC: config["ENABLE_OIDC_SYNC"] || "0",
    },
  });

  const originURL = !isEmpty(API_BASE_URL) ? API_BASE_URL : typeof window !== "undefined" ? window.location.origin : "";

  const OIDC_FORM_FIELDS: TControllerInputFormField<OIDCConfigFormValues>[] = [
    {
      key: "OIDC_DISPLAY_NAME",
      type: "text",
      label: "Display name",
      description: <>Shown on the login button, e.g. &quot;Continue with Keycloak&quot;.</>,
      placeholder: "Keycloak",
      error: Boolean(errors.OIDC_DISPLAY_NAME),
      required: false,
    },
    {
      key: "OIDC_ISSUER_URL",
      type: "text",
      label: "Issuer URL",
      description: (
        <>
          The OpenID Connect issuer. Plane discovers all endpoints from{" "}
          <CodeBlock darkerShade>{"<issuer>/.well-known/openid-configuration"}</CodeBlock>. For Keycloak this is{" "}
          <CodeBlock darkerShade>https://&lt;host&gt;/realms/&lt;realm&gt;</CodeBlock>.
        </>
      ),
      placeholder: "https://keycloak.example.com/realms/plane",
      error: Boolean(errors.OIDC_ISSUER_URL),
      required: true,
    },
    {
      key: "OIDC_CLIENT_ID",
      type: "text",
      label: "Client ID",
      description: <>The client ID of the OpenID Connect client you created for Plane in your identity provider.</>,
      placeholder: "plane",
      error: Boolean(errors.OIDC_CLIENT_ID),
      required: true,
    },
    {
      key: "OIDC_CLIENT_SECRET",
      type: "password",
      label: "Client secret",
      description: <>The client secret from the same client. Client authentication must be enabled on the client.</>,
      placeholder: "9b0050f94ec1b744e32ce79ea4ffacd40d4119cb",
      error: Boolean(errors.OIDC_CLIENT_SECRET),
      required: true,
    },
  ];

  const OIDC_SERVICE_FIELD: TCopyField[] = [
    {
      key: "Callback_URI",
      label: "Callback URI",
      url: `${originURL}/auth/oidc/callback/`,
      description: (
        <>
          We will auto-generate this. Add it to the <CodeBlock darkerShade>Valid redirect URIs</CodeBlock> of your
          client in your identity provider.
        </>
      ),
    },
    {
      key: "Space_Callback_URI",
      label: "Callback URI (public spaces)",
      url: `${originURL}/auth/spaces/oidc/callback/`,
      description: <>Add this one too if members will sign in from publicly shared pages.</>,
    },
  ];

  const onSubmit = async (formData: OIDCConfigFormValues) => {
    const payload: Partial<OIDCConfigFormValues> = { ...formData };

    try {
      const response = await updateInstanceConfigurations(payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Done!",
        message: "Your OpenID Connect authentication is configured. You should test it now.",
      });
      reset({
        OIDC_DISPLAY_NAME: response.find((item) => item.key === "OIDC_DISPLAY_NAME")?.value,
        OIDC_ISSUER_URL: response.find((item) => item.key === "OIDC_ISSUER_URL")?.value,
        OIDC_CLIENT_ID: response.find((item) => item.key === "OIDC_CLIENT_ID")?.value,
        OIDC_CLIENT_SECRET: response.find((item) => item.key === "OIDC_CLIENT_SECRET")?.value,
        OIDC_REQUIRE_EMAIL_VERIFIED: response.find((item) => item.key === "OIDC_REQUIRE_EMAIL_VERIFIED")?.value,
        ENABLE_OIDC_SYNC: response.find((item) => item.key === "ENABLE_OIDC_SYNC")?.value,
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
            <div className="pt-2.5 text-18 font-medium">Identity-provider details for Plane</div>
            {OIDC_FORM_FIELDS.map((field) => (
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
            <div className="flex items-center justify-between gap-1">
              <div className="flex flex-col gap-1">
                <h4 className="text-sm text-custom-text-300">Require verified email</h4>
                <p className="text-xs text-custom-text-400">
                  Reject sign-ins whose <CodeBlock darkerShade>email_verified</CodeBlock> claim is not true. Turn this
                  on if your identity provider allows self-registration with unverified email addresses.
                </p>
              </div>
              <div className="relative">
                <Controller
                  control={control}
                  name="OIDC_REQUIRE_EMAIL_VERIFIED"
                  render={({ field: { value, onChange } }) => {
                    const isOn = value === "1";
                    return <Switch checked={isOn} onCheckedChange={() => onChange(isOn ? "0" : "1")} size="sm" />;
                  }}
                />
              </div>
            </div>
            <ControllerSwitch control={control} field={OIDC_SYNC_SWITCH_FIELD} />
            <div className="flex flex-col gap-1 pt-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="primary"
                  size="md"
                  stretch="auto"
                  onClick={(e) => void handleSubmit(onSubmit)(e)}
                  loading={isSubmitting}
                  disabled={!isDirty}
                  label={isSubmitting ? "Saving" : "Save changes"}
                />
                <Button
                  variant="secondary"
                  size="md"
                  stretch="auto"
                  nativeButton={false}
                  render={<Link href="/authentication" onClick={handleGoBack} />}
                  label="Go back"
                />
              </div>
            </div>
          </div>
          <div className="col-span-2 md:col-span-1">
            <div className="flex flex-col gap-y-4 rounded-lg bg-layer-1 px-6 pt-1.5 pb-4">
              <div className="pt-2 text-18 font-medium">Plane-provided details for your identity provider</div>
              {OIDC_SERVICE_FIELD.map((field) => (
                <CopyField key={field.key} label={field.label} url={field.url} description={field.description} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
