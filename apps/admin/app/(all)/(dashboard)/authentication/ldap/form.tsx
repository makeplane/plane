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
import type { IFormattedInstanceConfiguration, TInstanceLDAPAuthenticationConfigurationKeys } from "@plane/types";
// components
import { ConfirmDiscardModal } from "@/components/common/confirm-discard-modal";
import type { TControllerInputFormField } from "@/components/common/controller-input";
import { ControllerInput } from "@/components/common/controller-input";
import type { TControllerSwitchFormField } from "@/components/common/controller-switch";
import { ControllerSwitch } from "@/components/common/controller-switch";
// hooks
import { useInstance } from "@/hooks/store";

type Props = {
  config: IFormattedInstanceConfiguration;
};

type LDAPConfigFormValues = Record<TInstanceLDAPAuthenticationConfigurationKeys, string>;

export function InstanceLDAPConfigForm(props: Props) {
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
  } = useForm<LDAPConfigFormValues>({
    defaultValues: {
      LDAP_SERVER_URI: config["LDAP_SERVER_URI"],
      LDAP_BIND_DN: config["LDAP_BIND_DN"],
      LDAP_BIND_PASSWORD: config["LDAP_BIND_PASSWORD"],
      LDAP_USER_SEARCH_BASE: config["LDAP_USER_SEARCH_BASE"],
      LDAP_USER_FILTER: config["LDAP_USER_FILTER"],
      LDAP_USE_TLS: config["LDAP_USE_TLS"] || "0",
    },
  });

  const LDAP_FORM_FIELDS: TControllerInputFormField[] = [
    {
      key: "LDAP_SERVER_URI",
      type: "text",
      label: "Server URI",
      description: "The LDAP server URI (e.g. ldap://ad.example.com:389 or ldaps://ad.example.com:636).",
      placeholder: "ldap://ad.example.com:389",
      error: Boolean(errors.LDAP_SERVER_URI),
      required: true,
    },
    {
      key: "LDAP_BIND_DN",
      type: "text",
      label: "Bind DN",
      description: "The distinguished name of the service account used to search for users.",
      placeholder: "CN=svc_plane,OU=Service,DC=example,DC=com",
      error: Boolean(errors.LDAP_BIND_DN),
      required: true,
    },
    {
      key: "LDAP_BIND_PASSWORD",
      type: "password",
      label: "Bind password",
      description: "The password for the service account. This is stored encrypted.",
      placeholder: "Service account password",
      error: Boolean(errors.LDAP_BIND_PASSWORD),
      required: true,
    },
    {
      key: "LDAP_USER_SEARCH_BASE",
      type: "text",
      label: "User search base",
      description: "The base DN to search for users (e.g. OU=Users,DC=example,DC=com).",
      placeholder: "OU=Users,DC=example,DC=com",
      error: Boolean(errors.LDAP_USER_SEARCH_BASE),
      required: true,
    },
    {
      key: "LDAP_USER_FILTER",
      type: "text",
      label: "User filter",
      description: "The LDAP filter to find users. Use %(user)s as placeholder for the username.",
      placeholder: "(sAMAccountName=%(user)s)",
      error: Boolean(errors.LDAP_USER_FILTER),
      required: true,
    },
  ];

  const LDAP_TLS_SWITCH_FIELD: TControllerSwitchFormField<LDAPConfigFormValues> = {
    name: "LDAP_USE_TLS",
    label: "Use STARTTLS",
  };

  const onSubmit = async (formData: LDAPConfigFormValues) => {
    const payload: Partial<LDAPConfigFormValues> = { ...formData };

    try {
      const response = await updateInstanceConfigurations(payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Done!",
        message: "Your LDAP authentication is configured. You should test it now.",
      });
      reset({
        LDAP_SERVER_URI: response.find((item) => item.key === "LDAP_SERVER_URI")?.value,
        LDAP_BIND_DN: response.find((item) => item.key === "LDAP_BIND_DN")?.value,
        LDAP_BIND_PASSWORD: response.find((item) => item.key === "LDAP_BIND_PASSWORD")?.value,
        LDAP_USER_SEARCH_BASE: response.find((item) => item.key === "LDAP_USER_SEARCH_BASE")?.value,
        LDAP_USER_FILTER: response.find((item) => item.key === "LDAP_USER_FILTER")?.value,
        LDAP_USE_TLS: response.find((item) => item.key === "LDAP_USE_TLS")?.value,
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
        <div className="flex flex-col gap-y-4 max-w-lg pt-1">
          <div className="pt-2.5 text-18 font-medium">LDAP server configuration</div>
          {LDAP_FORM_FIELDS.map((field) => (
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
          <ControllerSwitch control={control} field={LDAP_TLS_SWITCH_FIELD} />
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
      </div>
    </>
  );
}
