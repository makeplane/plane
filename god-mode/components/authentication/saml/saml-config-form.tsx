import { FC, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Link from "next/link";
// hooks
import useInstance from "hooks/use-instance";
// ui
import { Button, TOAST_TYPE, TextArea, getButtonStyling, setToast } from "@plane/ui";
// components
import {
  ConfirmDiscardModal,
  ControllerInput,
  TControllerInputFormField,
  CopyField,
  TCopyField,
} from "components/common";
// types
import { IFormattedInstanceConfiguration, TInstanceSAMLAuthenticationConfigurationKeys } from "@plane/types";
// helpers
import { cn } from "helpers/common.helper";

type Props = {
  config: IFormattedInstanceConfiguration;
};

type SAMLConfigFormValues = Record<TInstanceSAMLAuthenticationConfigurationKeys, string>;

export const InstanceSAMLConfigForm: FC<Props> = (props) => {
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
  } = useForm<SAMLConfigFormValues>({
    defaultValues: {
      SAML_ENTITY_ID: config["SAML_ENTITY_ID"],
      SAML_SSO_URL: config["SAML_SSO_URL"],
      SAML_LOGOUT_URL: config["SAML_LOGOUT_URL"],
      SAML_CERTIFICATE: config["SAML_CERTIFICATE"],
    },
  });

  const originURL = typeof window !== "undefined" ? window.location.origin : "";

  const samlFormFields: TControllerInputFormField[] = [
    {
      key: "SAML_ENTITY_ID",
      type: "text",
      label: "Entity ID",
      description: "Unique identifier for your Identity Provider (IdP) entity.",
      placeholder: "70a44354520df8bd9bcd",
      error: Boolean(errors.SAML_ENTITY_ID),
      required: true,
    },
    {
      key: "SAML_SSO_URL",
      type: "text",
      label: "SSO URLs",
      description: "URL used for Single Sign-On (SSO) with your Identity Provider (IdP).",
      placeholder: "https://example.com/sso",
      error: Boolean(errors.SAML_SSO_URL),
      required: true,
    },
    {
      key: "SAML_LOGOUT_URL",
      type: "text",
      label: "Logout URL",
      description: "Add your SAML logout URL here for seamless session management.",
      placeholder: "https://example.com/logout",
      error: Boolean(errors.SAML_LOGOUT_URL),
      required: false,
    },
  ];

  const samlCopyFields: TCopyField[] = [
    {
      key: "Callback_URI",
      label: "Callback URI",
      url: `${originURL}/auth/saml/callback/`,
      description:
        "We will auto-generate this. Paste this in the single sign on callback url section of your identity provider.",
    },
    {
      key: "Metadata_Information",
      label: "Metadata Information",
      url: `${originURL}/auth/saml/metadata/`,
      description:
        "We will auto-generate this. Paste this into your audience URI or SP entity ID section of your identity provider.",
    },
    {
      key: "Logout_URI",
      label: "Logout URI",
      url: `${originURL}/auth/saml/logout/`,
      description: "We will auto-generate this. Add this as a trusted origin in your identity provider.",
    },
  ];

  const onSubmit = async (formData: SAMLConfigFormValues) => {
    const payload: Partial<SAMLConfigFormValues> = { ...formData };

    await updateInstanceConfigurations(payload)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success",
          message: "SAML Configuration Settings updated successfully",
        });
        reset();
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
          <div className="flex flex-col gap-y-4 col-span-2 md:col-span-1">
            <div className="pt-2 text-xl font-medium">Configuration</div>
            {samlFormFields.map((field) => (
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
              <h4 className="text-sm">Certificate</h4>
              <Controller
                control={control}
                name="SAML_CERTIFICATE"
                rules={{ required: "Certificate is required." }}
                render={({ field: { value, onChange } }) => (
                  <TextArea
                    id="SAML_CERTIFICATE"
                    name="SAML_CERTIFICATE"
                    value={value}
                    onChange={onChange}
                    hasError={Boolean(errors.SAML_CERTIFICATE)}
                    placeholder="---BEGIN CERTIFICATE---\n2yWn1gc7DhOFB9\nr0gbE+\n---END CERTIFICATE---"
                    className="min-h-[102px] w-full rounded-md font-medium text-sm"
                  />
                )}
              />
              <p className="text-xs text-custom-text-400">
                Certificate used by your IdP for digital signature verification in SAML transactions.
              </p>
            </div>
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
            <div className="flex flex-col gap-y-4 px-6 py-4 my-2 bg-custom-background-80/60 rounded-lg">
              <div className="pt-2 text-xl font-medium">Service provider details</div>
              {samlCopyFields.map((field) => (
                <CopyField key={field.key} label={field.label} url={field.url} description={field.description} />
              ))}
              <div className="flex flex-col gap-1">
                <h4 className="text-sm text-custom-text-300 font-medium">Name ID format</h4>
                <p className="text-sm text-custom-text-100">emailAddress</p>
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm text-custom-text-300 font-medium">Attribute mapping</h4>
                <ul className="text-sm text-custom-text-100 list-disc pl-6">
                  <li>first_name to user.firstName</li>
                  <li>last_name to user.lastName</li>
                  <li>email to user.email</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
