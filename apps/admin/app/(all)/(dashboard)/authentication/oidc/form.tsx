/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { isEmpty } from "lodash-es";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Monitor } from "lucide-react";
// plane internal packages
import { API_BASE_URL } from "@plane/constants";
import { Button, getButtonStyling } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IFormattedInstanceConfiguration, TInstanceOIDCAuthenticationConfigurationKeys } from "@plane/types";
// components
import { CodeBlock } from "@/components/common/code-block";
import { ConfirmDiscardModal } from "@/components/common/confirm-discard-modal";
import type { TControllerInputFormField } from "@/components/common/controller-input";
import { ControllerInput } from "@/components/common/controller-input";
import type { TCopyField } from "@/components/common/copy-field";
import { CopyField } from "@/components/common/copy-field";
// hooks
import { useInstance } from "@/hooks/store";

type Props = {
  config: IFormattedInstanceConfiguration;
};

type OIDCConfigFormValues = Record<TInstanceOIDCAuthenticationConfigurationKeys, string>;

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
      OIDC_ISSUER: config["OIDC_ISSUER"],
      OIDC_CLIENT_ID: config["OIDC_CLIENT_ID"],
      OIDC_CLIENT_SECRET: config["OIDC_CLIENT_SECRET"],
      OIDC_AUTHORIZATION_ENDPOINT: config["OIDC_AUTHORIZATION_ENDPOINT"],
      OIDC_TOKEN_ENDPOINT: config["OIDC_TOKEN_ENDPOINT"],
      OIDC_USERINFO_ENDPOINT: config["OIDC_USERINFO_ENDPOINT"],
      OIDC_JWKS_URI: config["OIDC_JWKS_URI"],
      OIDC_SCOPE: config["OIDC_SCOPE"] || "openid email profile",
    },
  });

  const originURL = !isEmpty(API_BASE_URL) ? API_BASE_URL : typeof window !== "undefined" ? window.location.origin : "";

  const OIDC_IDENTITY_FIELDS: TControllerInputFormField[] = [
    {
      key: "OIDC_DISPLAY_NAME",
      type: "text",
      label: "Display name",
      description: "Shown on the login button, e.g. \"Keycloak\" or \"Kanidm\".",
      placeholder: "Keycloak",
      error: Boolean(errors.OIDC_DISPLAY_NAME),
      required: false,
    },
    {
      key: "OIDC_CLIENT_ID",
      type: "text",
      label: "Client ID",
      description: "The client/application ID you registered with your identity provider.",
      placeholder: "plane",
      error: Boolean(errors.OIDC_CLIENT_ID),
      required: true,
    },
    {
      key: "OIDC_CLIENT_SECRET",
      type: "password",
      label: "Client secret",
      description: "The client secret issued alongside the client ID above.",
      placeholder: "••••••••••••••••",
      error: Boolean(errors.OIDC_CLIENT_SECRET),
      required: true,
    },
  ];

  const OIDC_DISCOVERY_FIELD: TControllerInputFormField[] = [
    {
      key: "OIDC_ISSUER",
      type: "text",
      label: "Issuer URL",
      description:
        "Recommended. We'll fetch authorization/token/userinfo/JWKS endpoints from \"<issuer>/.well-known/openid-configuration\". Leave the four endpoint fields below blank to use this.",
      placeholder: "https://keycloak.example.com/realms/plane",
      error: Boolean(errors.OIDC_ISSUER),
      required: false,
    },
  ];

  const OIDC_MANUAL_ENDPOINT_FIELDS: TControllerInputFormField[] = [
    {
      key: "OIDC_AUTHORIZATION_ENDPOINT",
      type: "text",
      label: "Authorization endpoint",
      description: "Only needed if you're not using an issuer URL above, or want to override discovery.",
      placeholder: "https://keycloak.example.com/realms/plane/protocol/openid-connect/auth",
      error: Boolean(errors.OIDC_AUTHORIZATION_ENDPOINT),
      required: false,
    },
    {
      key: "OIDC_TOKEN_ENDPOINT",
      type: "text",
      label: "Token endpoint",
      description: "",
      placeholder: "https://keycloak.example.com/realms/plane/protocol/openid-connect/token",
      error: Boolean(errors.OIDC_TOKEN_ENDPOINT),
      required: false,
    },
    {
      key: "OIDC_USERINFO_ENDPOINT",
      type: "text",
      label: "Userinfo endpoint",
      description: "",
      placeholder: "https://keycloak.example.com/realms/plane/protocol/openid-connect/userinfo",
      error: Boolean(errors.OIDC_USERINFO_ENDPOINT),
      required: false,
    },
    {
      key: "OIDC_JWKS_URI",
      type: "text",
      label: "JWKS URI",
      description: "Used to verify the signature of the ID token. Strongly recommended even with manual endpoints.",
      placeholder: "https://keycloak.example.com/realms/plane/protocol/openid-connect/certs",
      error: Boolean(errors.OIDC_JWKS_URI),
      required: false,
    },
    {
      key: "OIDC_SCOPE",
      type: "text",
      label: "Scope",
      description: "Space-separated OAuth scopes requested at the authorization endpoint.",
      placeholder: "openid email profile",
      error: Boolean(errors.OIDC_SCOPE),
      required: false,
    },
  ];

  const OIDC_COMMON_SERVICE_DETAILS: TCopyField[] = [
    {
      key: "Origin_URL",
      label: "Origin URL",
      url: originURL,
      description: <p>Paste this into your identity provider's allowed web origins / redirect URI base, if it asks for one.</p>,
    },
  ];

  const OIDC_SERVICE_DETAILS: TCopyField[] = [
    {
      key: "Callback_URI",
      label: "Callback URI",
      url: `${originURL}/auth/oidc/callback/`,
      description: <p>Paste this into your identity provider's redirect URI / callback URL field for this client.</p>,
    },
  ];

  const onSubmit = async (formData: OIDCConfigFormValues) => {
    const payload: Partial<OIDCConfigFormValues> = { ...formData };

    try {
      const response = await updateInstanceConfigurations(payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Done!",
        message: "Your OIDC authentication is configured. You should test it now.",
      });
      reset({
        OIDC_DISPLAY_NAME: response.find((item) => item.key === "OIDC_DISPLAY_NAME")?.value,
        OIDC_ISSUER: response.find((item) => item.key === "OIDC_ISSUER")?.value,
        OIDC_CLIENT_ID: response.find((item) => item.key === "OIDC_CLIENT_ID")?.value,
        OIDC_CLIENT_SECRET: response.find((item) => item.key === "OIDC_CLIENT_SECRET")?.value,
        OIDC_AUTHORIZATION_ENDPOINT: response.find((item) => item.key === "OIDC_AUTHORIZATION_ENDPOINT")?.value,
        OIDC_TOKEN_ENDPOINT: response.find((item) => item.key === "OIDC_TOKEN_ENDPOINT")?.value,
        OIDC_USERINFO_ENDPOINT: response.find((item) => item.key === "OIDC_USERINFO_ENDPOINT")?.value,
        OIDC_JWKS_URI: response.find((item) => item.key === "OIDC_JWKS_URI")?.value,
        OIDC_SCOPE: response.find((item) => item.key === "OIDC_SCOPE")?.value,
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
            <div className="pt-2.5 text-18 font-medium">Identity provider details</div>
            {OIDC_IDENTITY_FIELDS.map((field) => (
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

            <div className="pt-4 text-14 font-medium text-secondary">Discovery (recommended)</div>
            {OIDC_DISCOVERY_FIELD.map((field) => (
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

            <div className="pt-4 text-14 font-medium text-secondary">Manual endpoints (optional overrides)</div>
            {OIDC_MANUAL_ENDPOINT_FIELDS.map((field) => (
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
          <div className="col-span-2 flex flex-col gap-y-6 md:col-span-1">
            <div className="pt-2 text-18 font-medium">Plane-provided details for your IdP</div>

            <div className="flex flex-col gap-y-4">
              {/* common service details */}
              <div className="flex flex-col gap-y-4 rounded-lg bg-layer-1 px-6 py-4">
                {OIDC_COMMON_SERVICE_DETAILS.map((field) => (
                  <CopyField key={field.key} label={field.label} url={field.url} description={field.description} />
                ))}
              </div>

              {/* web service details */}
              <div className="flex flex-col overflow-hidden rounded-lg">
                <div className="flex items-center gap-x-3 bg-layer-3 px-6 py-3 text-11 font-medium text-secondary uppercase">
                  <Monitor className="h-3 w-3" />
                  Web
                </div>
                <div className="flex flex-col gap-y-4 bg-layer-1 px-6 py-4">
                  {OIDC_SERVICE_DETAILS.map((field) => (
                    <CopyField key={field.key} label={field.label} url={field.url} description={field.description} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
