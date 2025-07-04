import { FC, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
// plane internal packages
import { IFormattedInstanceConfiguration, TInstanceOIDCAuthenticationConfigurationKeys } from "@plane/types";
import { Button, TOAST_TYPE, getButtonStyling, setToast } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { CodeBlock } from "@/components/common/code-block";
import { ConfirmDiscardModal } from "@/components/common/confirm-discard-modal";
import { ControllerInput, TControllerInputFormField } from "@/components/common/controller-input";
import { TCopyField, CopyField } from "@/components/common/copy-field";
// hooks
import { useInstance } from "@/hooks/store";

type Props = {
  config: IFormattedInstanceConfiguration;
};

type OIDCConfigFormValues = Record<TInstanceOIDCAuthenticationConfigurationKeys, string>;

export const InstanceOIDCConfigForm: FC<Props> = (props) => {
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
      OIDC_CLIENT_ID: config["OIDC_CLIENT_ID"],
      OIDC_CLIENT_SECRET: config["OIDC_CLIENT_SECRET"],
      OIDC_TOKEN_URL: config["OIDC_TOKEN_URL"],
      OIDC_USERINFO_URL: config["OIDC_USERINFO_URL"],
      OIDC_AUTHORIZE_URL: config["OIDC_AUTHORIZE_URL"],
      OIDC_LOGOUT_URL: config["OIDC_LOGOUT_URL"],
      OIDC_PROVIDER_NAME: config["OIDC_PROVIDER_NAME"],
    },
  });

  const originURL = typeof window !== "undefined" ? window.location.origin : "";

  const OIDC_FORM_FIELDS: TControllerInputFormField[] = [
    {
      key: "OIDC_CLIENT_ID",
      type: "text",
      label: "Client ID",
      description: "A unique ID for this Plane app that you register on your IdP",
      placeholder: "abc123xyz789",
      error: Boolean(errors.OIDC_CLIENT_ID),
      required: true,
    },
    {
      key: "OIDC_CLIENT_SECRET",
      type: "password",
      label: "Client secret",
      description: "The secret key that authenticates this Plane app to your IdP",
      placeholder: "s3cr3tK3y123!",
      error: Boolean(errors.OIDC_CLIENT_SECRET),
      required: true,
    },
    {
      key: "OIDC_AUTHORIZE_URL",
      type: "text",
      label: "Authorize URL",
      description: (
        <>
          The URL that brings up your IdP{"'"}s authentication screen when your users click the{" "}
          <CodeBlock>{"Continue with"}</CodeBlock>
        </>
      ),
      placeholder: "https://example.com/",
      error: Boolean(errors.OIDC_AUTHORIZE_URL),
      required: true,
    },
    {
      key: "OIDC_TOKEN_URL",
      type: "text",
      label: "Token URL",
      description: "The URL that talks to the IdP and persists user authentication on Plane",
      placeholder: "https://example.com/oauth/token",
      error: Boolean(errors.OIDC_TOKEN_URL),
      required: true,
    },
    {
      key: "OIDC_USERINFO_URL",
      type: "text",
      label: "Users' info URL",
      description: "The URL that fetches your users' info from your IdP",
      placeholder: "https://example.com/userinfo",
      error: Boolean(errors.OIDC_USERINFO_URL),
      required: true,
    },
    {
      key: "OIDC_LOGOUT_URL",
      type: "text",
      label: "Logout URL",
      description: "Optional field that controls where your users go after they log out of Plane",
      placeholder: "https://example.com/logout",
      error: Boolean(errors.OIDC_LOGOUT_URL),
      required: false,
    },
    {
      key: "OIDC_PROVIDER_NAME",
      type: "text",
      label: "IdP's name",
      description: (
        <>
          Optional field for the name that your users see on the <CodeBlock>Continue with</CodeBlock> button
        </>
      ),
      placeholder: "Okta",
      error: Boolean(errors.OIDC_PROVIDER_NAME),
      required: false,
    },
  ];

  const OIDC_SERVICE_DETAILS: TCopyField[] = [
    {
      key: "Origin_URI",
      label: "Origin URI",
      url: `${originURL}/auth/oidc/`,
      description:
        "We will generate this for this Plane app. Add this as a trusted origin on your IdP's corresponding field.",
    },
    {
      key: "Callback_URI",
      label: "Callback URI",
      url: `${originURL}/auth/oidc/callback/`,
      description: (
        <>
          We will generate this for you.Add this in the <CodeBlock darkerShade>Sign-in redirect URI</CodeBlock> field of
          your IdP.
        </>
      ),
    },
    {
      key: "Logout_URI",
      label: "Logout URI",
      url: `${originURL}/auth/oidc/logout/`,
      description: (
        <>
          We will generate this for you. Add this in the <CodeBlock darkerShade>Logout redirect URI</CodeBlock> field of
          your IdP.
        </>
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
          message: "Your OIDC-based authentication is configured. You should test it now.",
        });
        reset({
          OIDC_CLIENT_ID: response.find((item) => item.key === "OIDC_CLIENT_ID")?.value,
          OIDC_CLIENT_SECRET: response.find((item) => item.key === "OIDC_CLIENT_SECRET")?.value,
          OIDC_AUTHORIZE_URL: response.find((item) => item.key === "OIDC_AUTHORIZE_URL")?.value,
          OIDC_TOKEN_URL: response.find((item) => item.key === "OIDC_TOKEN_URL")?.value,
          OIDC_USERINFO_URL: response.find((item) => item.key === "OIDC_USERINFO_URL")?.value,
          OIDC_LOGOUT_URL: response.find((item) => item.key === "OIDC_LOGOUT_URL")?.value,
          OIDC_PROVIDER_NAME: response.find((item) => item.key === "OIDC_PROVIDER_NAME")?.value,
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
            <div className="pt-2.5 text-xl font-medium">IdP-provided details for Plane</div>
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
                <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting} disabled={!isDirty}>
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
                <Link
                  href="/authentication"
                  className={cn(getButtonStyling("link-neutral", "md"), "font-medium")}
                  onClick={handleGoBack}
                >
                  Go back
                </Link>
              </div>
            </div>
          </div>
          <div className="col-span-2 md:col-span-1">
            <div className="flex flex-col gap-y-4 px-6 pt-1.5 pb-4 bg-custom-background-80/60 rounded-lg">
              <div className="pt-2 text-xl font-medium">Plane-provided details for your IdP</div>
              {OIDC_SERVICE_DETAILS.map((field) => (
                <CopyField key={field.key} label={field.label} url={field.url} description={field.description} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
