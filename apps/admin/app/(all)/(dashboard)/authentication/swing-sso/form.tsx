/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
// plane internal packages
import { Button, getButtonStyling } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IFormattedInstanceConfiguration, TInstanceSwingSSOAuthenticationConfigurationKeys } from "@plane/types";
// components
import { ConfirmDiscardModal } from "@/components/common/confirm-discard-modal";
import type { TControllerInputFormField } from "@/components/common/controller-input";
import { ControllerInput } from "@/components/common/controller-input";
// hooks
import { useInstance } from "@/hooks/store";
// local
import { SwingSSOTestAuthModal } from "./test-auth-modal";

type Props = {
  config: IFormattedInstanceConfiguration;
};

type SwingSSOConfigFormValues = Record<TInstanceSwingSSOAuthenticationConfigurationKeys, string>;

export function InstanceSwingSSOConfigForm(props: Props) {
  const { config } = props;
  // states
  const [isDiscardChangesModalOpen, setIsDiscardChangesModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  // store hooks
  const { updateInstanceConfigurations } = useInstance();
  // form data
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<SwingSSOConfigFormValues>({
    defaultValues: {
      SWING_SSO_URL: config["SWING_SSO_URL"],
      SWING_SSO_CLIENT_ID: config["SWING_SSO_CLIENT_ID"],
      SWING_SSO_CLIENT_SECRET: config["SWING_SSO_CLIENT_SECRET"],
      SWING_SSO_COMPANY_CODE: config["SWING_SSO_COMPANY_CODE"] || "sh",
    },
  });

  const SWING_SSO_FORM_FIELDS: TControllerInputFormField[] = [
    {
      key: "SWING_SSO_URL",
      type: "text",
      label: "Swing SSO URL",
      description: "The Swing SSO authentication API endpoint URL.",
      placeholder: "https://swing.example.com/api/auth",
      error: Boolean(errors.SWING_SSO_URL),
      required: true,
    },
    {
      key: "SWING_SSO_CLIENT_ID",
      type: "text",
      label: "Client ID",
      description: "The client ID for authenticating with the Swing SSO service.",
      placeholder: "your-client-id",
      error: Boolean(errors.SWING_SSO_CLIENT_ID),
      required: true,
    },
    {
      key: "SWING_SSO_CLIENT_SECRET",
      type: "password",
      label: "Client secret",
      description: "The client secret for authenticating with the Swing SSO service. Stored encrypted.",
      placeholder: "Client secret",
      error: Boolean(errors.SWING_SSO_CLIENT_SECRET),
      required: true,
    },
    {
      key: "SWING_SSO_COMPANY_CODE",
      type: "text",
      label: "Company code",
      description: 'The company code sent to Swing SSO (default: "sh").',
      placeholder: "sh",
      error: Boolean(errors.SWING_SSO_COMPANY_CODE),
      required: true,
    },
  ];

  const onSubmit = async (formData: SwingSSOConfigFormValues) => {
    const payload: Partial<SwingSSOConfigFormValues> = { ...formData };
    try {
      const response = await updateInstanceConfigurations(payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Done!",
        message: "Your Swing SSO configuration is saved. You should test it now.",
      });
      reset({
        SWING_SSO_URL: response.find((item) => item.key === "SWING_SSO_URL")?.value,
        SWING_SSO_CLIENT_ID: response.find((item) => item.key === "SWING_SSO_CLIENT_ID")?.value,
        SWING_SSO_CLIENT_SECRET: response.find((item) => item.key === "SWING_SSO_CLIENT_SECRET")?.value,
        SWING_SSO_COMPANY_CODE: response.find((item) => item.key === "SWING_SSO_COMPANY_CODE")?.value,
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

  const isConfigured =
    !!config["SWING_SSO_URL"] && !!config["SWING_SSO_CLIENT_ID"] && !!config["SWING_SSO_CLIENT_SECRET"];

  return (
    <>
      <ConfirmDiscardModal
        isOpen={isDiscardChangesModalOpen}
        onDiscardHref="/authentication"
        handleClose={() => setIsDiscardChangesModalOpen(false)}
      />
      <SwingSSOTestAuthModal isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)} />
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-y-4 max-w-lg pt-1">
          <div className="pt-2.5 text-18 font-medium">Swing SSO configuration</div>
          {SWING_SSO_FORM_FIELDS.map((field) => (
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
              {isConfigured && (
                <Button variant="secondary" size="lg" onClick={() => setIsTestModalOpen(true)}>
                  Test Authentication
                </Button>
              )}
              <Link href="/authentication" className={getButtonStyling("secondary", "lg")} onClick={handleGoBack}>
                Go back
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
