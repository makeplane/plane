import { useState } from "react";
import { isEmpty } from "lodash-es";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Monitor } from "lucide-react";
// plane internal packages
import { API_BASE_URL } from "@plane/constants";
import { Button, getButtonStyling } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IFormattedInstanceConfiguration } from "@plane/types";
import { cn } from "@plane/utils";
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

type OIDCConfigFormValues = {
  OIDC_CLIENT_ID: string;
  OIDC_CLIENT_SECRET: string;
  OIDC_AUTHORIZATION_URL: string;
  OIDC_TOKEN_URL: string;
  OIDC_USERINFO_URL: string;
  OIDC_SCOPE: string;
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
      OIDC_CLIENT_ID: config["OIDC_CLIENT_ID"] ?? "",
      OIDC_CLIENT_SECRET: config["OIDC_CLIENT_SECRET"] ?? "",
      OIDC_AUTHORIZATION_URL: config["OIDC_AUTHORIZATION_URL"] ?? "",
      OIDC_TOKEN_URL: config["OIDC_TOKEN_URL"] ?? "",
      OIDC_USERINFO_URL: config["OIDC_USERINFO_URL"] ?? "",
      OIDC_SCOPE: config["OIDC_SCOPE"] ?? "openid email profile",
    },
  });

  const originURL = !isEmpty(API_BASE_URL) ? API_BASE_URL : typeof window !== "undefined" ? window.location.origin : "";

  const OIDC_FORM_FIELDS: TControllerInputFormField[] = [
    {
      key: "OIDC_CLIENT_ID",
      type: "text",
      label: "Client ID",
      description: (
        <>
          The OAuth client ID from your identity provider. For Login.gov, register at{" "}
          <a
            tabIndex={-1}
            href="https://dashboard.int.identitysandbox.gov"
            target="_blank"
            className="text-accent-primary hover:underline"
            rel="noreferrer"
          >
            Login.gov sandbox
          </a>{" "}
          or{" "}
          <a
            tabIndex={-1}
            href="https://dashboard.login.gov"
            target="_blank"
            className="text-accent-primary hover:underline"
            rel="noreferrer"
          >
            Login.gov production
          </a>
          .
        </>
      ),
      placeholder: "urn:gov:gsa:openidconnect.profiles:sp:sso:agency:app",
      error: Boolean(errors.OIDC_CLIENT_ID),
      required: true,
    },
    {
      key: "OIDC_CLIENT_SECRET",
      type: "password",
      label: "Client secret",
      description: "The OAuth client secret from your identity provider. Leave empty for public clients using PKCE only.",
      placeholder: "Enter your client secret",
      error: Boolean(errors.OIDC_CLIENT_SECRET),
      required: false,
    },
    {
      key: "OIDC_AUTHORIZATION_URL",
      type: "text",
      label: "Authorization URL",
      description: (
        <>
          The OIDC authorization endpoint. For Login.gov sandbox:{" "}
          <CodeBlock darkerShade>https://idp.int.identitysandbox.gov/openid_connect/authorize</CodeBlock>
        </>
      ),
      placeholder: "https://idp.int.identitysandbox.gov/openid_connect/authorize",
      error: Boolean(errors.OIDC_AUTHORIZATION_URL),
      required: true,
    },
    {
      key: "OIDC_TOKEN_URL",
      type: "text",
      label: "Token URL",
      description: (
        <>
          The OIDC token endpoint. For Login.gov sandbox:{" "}
          <CodeBlock darkerShade>https://idp.int.identitysandbox.gov/api/openid_connect/token</CodeBlock>
        </>
      ),
      placeholder: "https://idp.int.identitysandbox.gov/api/openid_connect/token",
      error: Boolean(errors.OIDC_TOKEN_URL),
      required: true,
    },
    {
      key: "OIDC_USERINFO_URL",
      type: "text",
      label: "Userinfo URL",
      description: (
        <>
          The OIDC userinfo endpoint. For Login.gov sandbox:{" "}
          <CodeBlock darkerShade>https://idp.int.identitysandbox.gov/api/openid_connect/userinfo</CodeBlock>
        </>
      ),
      placeholder: "https://idp.int.identitysandbox.gov/api/openid_connect/userinfo",
      error: Boolean(errors.OIDC_USERINFO_URL),
      required: false,
    },
    {
      key: "OIDC_SCOPE",
      type: "text",
      label: "Scope",
      description: "OIDC scopes to request. Default: openid email profile",
      placeholder: "openid email profile",
      error: Boolean(errors.OIDC_SCOPE),
      required: false,
    },
  ];

  const OIDC_SERVICE_DETAILS: TCopyField[] = [
    {
      key: "Callback_URI",
      label: "Callback URI",
      url: `${originURL}/auth/oidc/callback/`,
      description: (
        <p>
          We will auto-generate this. Add this to your identity provider&apos;s <CodeBlock darkerShade>Redirect URI</CodeBlock>{" "}
          configuration.
        </p>
      ),
    },
  ];

  const onSubmit = async (formData: OIDCConfigFormValues) => {
    const payload: Partial<OIDCConfigFormValues> = { ...formData };

    await updateInstanceConfigurations(payload)
      .then((response = []) => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Done!",
          message: "Your OIDC authentication is configured. You should test it now.",
        });
        reset({
          OIDC_CLIENT_ID: response.find((item) => item.key === "OIDC_CLIENT_ID")?.value ?? "",
          OIDC_CLIENT_SECRET: response.find((item) => item.key === "OIDC_CLIENT_SECRET")?.value ?? "",
          OIDC_AUTHORIZATION_URL: response.find((item) => item.key === "OIDC_AUTHORIZATION_URL")?.value ?? "",
          OIDC_TOKEN_URL: response.find((item) => item.key === "OIDC_TOKEN_URL")?.value ?? "",
          OIDC_USERINFO_URL: response.find((item) => item.key === "OIDC_USERINFO_URL")?.value ?? "",
          OIDC_SCOPE: response.find((item) => item.key === "OIDC_SCOPE")?.value ?? "openid email profile",
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
            <div className="pt-2.5 text-18 font-medium">OIDC Provider Details</div>
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
            <div className="flex flex-col gap-1 pt-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSubmit(onSubmit)}
                  loading={isSubmitting}
                  disabled={!isDirty}
                >
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
                <Link href="/authentication" className={getButtonStyling("secondary", "lg")} onClick={handleGoBack}>
                  Go back
                </Link>
              </div>
            </div>
          </div>
          <div className="col-span-2 md:col-span-1 flex flex-col gap-y-6">
            <div className="pt-2 text-18 font-medium">Plane-provided details for your IdP</div>

            <div className="flex flex-col gap-y-4">
              {/* web service details */}
              <div className="flex flex-col rounded-lg overflow-hidden">
                <div className="px-6 py-3 bg-layer-1/60 font-medium text-11 uppercase flex items-center gap-x-3 text-secondary">
                  <Monitor className="w-3 h-3" />
                  Web
                </div>
                <div className="px-6 py-4 flex flex-col gap-y-4 bg-layer-1">
                  {OIDC_SERVICE_DETAILS.map((field) => (
                    <CopyField key={field.key} label={field.label} url={field.url} description={field.description} />
                  ))}
                </div>
              </div>

              {/* Login.gov specific guidance */}
              <div className="px-6 py-4 bg-layer-1 rounded-lg">
                <div className="text-sm font-medium text-primary mb-2">Login.gov Configuration Tips</div>
                <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
                  <li>Use PKCE (code challenge) for enhanced security</li>
                  <li>Login.gov requires the <CodeBlock darkerShade>openid</CodeBlock> and <CodeBlock darkerShade>email</CodeBlock> scopes</li>
                  <li>Sandbox environment is for testing only</li>
                  <li>Production access requires agency approval</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
