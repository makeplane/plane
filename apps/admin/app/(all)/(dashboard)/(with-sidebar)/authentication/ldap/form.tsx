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

import type { FC } from "react";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
// plane internal packages
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IFormattedInstanceConfiguration, TInstanceLDAPAuthenticationConfigurationKeys } from "@plane/types";
import { Button, getButtonStyling } from "@plane/propel/button";
// components
import { CodeBlock } from "@/components/common/code-block";
import { ConfirmDiscardModal } from "@/components/common/confirm-discard-modal";
import type { TControllerInputFormField } from "@/components/common/controller-input";
import { ControllerInput } from "@/components/common/controller-input";
// hooks
import { useInstance } from "@/hooks/store";
import { Monitor, ShieldUser } from "lucide-react";
import type { TCopyField } from "@/components/common/copy-field";
import { ServiceDetailsSection } from "@/components/authentication/service-details-section";

type Props = {
  config: IFormattedInstanceConfiguration;
};

type LDAPConfigFormValues = Record<TInstanceLDAPAuthenticationConfigurationKeys, string>;

export const InstanceLDAPConfigForm: FC<Props> = (props) => {
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
      LDAP_USER_SEARCH_FILTER: config["LDAP_USER_SEARCH_FILTER"],
      LDAP_USER_ATTRIBUTES: config["LDAP_USER_ATTRIBUTES"],
      LDAP_PROVIDER_NAME: config["LDAP_PROVIDER_NAME"],
    },
  });

  const originURL = typeof window !== "undefined" ? window.location.origin : "";

  const LDAP_FORM_FIELDS: TControllerInputFormField[] = [
    {
      key: "LDAP_SERVER_URI",
      type: "text",
      label: "Server URI",
      description: "The URI of your LDAP server (e.g., ldap://ldap.example.com:389)",
      placeholder: "ldap://ldap.example.com:389",
      error: Boolean(errors.LDAP_SERVER_URI),
      required: true,
    },
    {
      key: "LDAP_BIND_DN",
      type: "text",
      label: "Bind DN",
      description: "The distinguished name to bind to the LDAP server",
      placeholder: "cn=admin,dc=example,dc=com",
      error: Boolean(errors.LDAP_BIND_DN),
      required: true,
    },
    {
      key: "LDAP_BIND_PASSWORD",
      type: "password",
      label: "Bind Password",
      description: "The password for the bind DN",
      placeholder: "Enter bind password",
      error: Boolean(errors.LDAP_BIND_PASSWORD),
      required: true,
    },
    {
      key: "LDAP_USER_SEARCH_BASE",
      type: "text",
      label: "User Search Base",
      description: "The base DN to search for users",
      placeholder: "ou=users,dc=example,dc=com",
      error: Boolean(errors.LDAP_USER_SEARCH_BASE),
      required: true,
    },
    {
      key: "LDAP_USER_SEARCH_FILTER",
      type: "text",
      label: "User Search Filter",
      description: "The LDAP filter to find users (e.g., (uid={username}))",
      placeholder: "(uid={username})",
      error: Boolean(errors.LDAP_USER_SEARCH_FILTER),
      required: false,
    },
    {
      key: "LDAP_USER_ATTRIBUTES",
      type: "text",
      label: "User Attributes",
      description: "Comma-separated list of attributes to retrieve (e.g., uid,cn,mail)",
      placeholder: "uid,cn,mail,displayName",
      error: Boolean(errors.LDAP_USER_ATTRIBUTES),
      required: false,
    },
    {
      key: "LDAP_PROVIDER_NAME",
      type: "text",
      label: "Provider's name",
      description: (
        <>
          Optional field for the name that your users see on the <CodeBlock>Continue with</CodeBlock> button
        </>
      ),
      placeholder: "LDAP",
      error: Boolean(errors.LDAP_PROVIDER_NAME),
      required: false,
    },
  ];

  const LDAP_SERVICE_DETAILS: TCopyField[] = [
    {
      key: "Authentication_Endpoint",
      label: "Authentication Endpoint",
      url: `${originURL}/auth/ldap/`,
      description: (
        <>
          The endpoint where users authenticate with their LDAP credentials. Ensure your LDAP server is accessible from
          Plane. Standard ports: <CodeBlock darkerShade>389</CodeBlock> for LDAP, <CodeBlock darkerShade>636</CodeBlock>{" "}
          for LDAPS (LDAP over SSL).
        </>
      ),
    },
  ];

  // const LDAP_MOBILE_SERVICE_DETAILS: TCopyField[] = [];

  const LDAP_ADMIN_SERVICE_DETAILS: TCopyField[] = [
    {
      key: "admin_authentication_endpoint",
      label: "Authentication Endpoint",
      url: `${originURL}/api/instances/admin/ldap/`,
      description: (
        <>
          The endpoint where admins authenticate with their LDAP credentials. Ensure your LDAP server is accessible from
          Plane. Standard ports: <CodeBlock darkerShade>389</CodeBlock> for LDAP, <CodeBlock darkerShade>636</CodeBlock>{" "}
          for LDAPS (LDAP over SSL).
        </>
      ),
    },
  ];

  const onSubmit = async (formData: LDAPConfigFormValues) => {
    const payload: Partial<LDAPConfigFormValues> = { ...formData };

    await updateInstanceConfigurations(payload)
      .then((response = []) => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Done!",
          message: "Your LDAP-based authentication is configured. You should test it now.",
        });
        reset({
          LDAP_SERVER_URI: response.find((item) => item.key === "LDAP_SERVER_URI")?.value,
          LDAP_BIND_DN: response.find((item) => item.key === "LDAP_BIND_DN")?.value,
          LDAP_BIND_PASSWORD: response.find((item) => item.key === "LDAP_BIND_PASSWORD")?.value,
          LDAP_USER_SEARCH_BASE: response.find((item) => item.key === "LDAP_USER_SEARCH_BASE")?.value,
          LDAP_USER_SEARCH_FILTER: response.find((item) => item.key === "LDAP_USER_SEARCH_FILTER")?.value,
          LDAP_USER_ATTRIBUTES: response.find((item) => item.key === "LDAP_USER_ATTRIBUTES")?.value,
          LDAP_PROVIDER_NAME: response.find((item) => item.key === "LDAP_PROVIDER_NAME")?.value,
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
            <div className="pt-2.5 text-18 font-medium">IdP-provided details for Plane</div>
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
            <div className="flex flex-col gap-1 pt-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={(e) => {
                    void handleSubmit(onSubmit)(e);
                  }}
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
            <div className="pt-2 text-18 font-medium">Plane-provided details for your IdP</div>
            <div className="flex flex-col gap-y-4">
              {/* web service details */}
              <ServiceDetailsSection icon={Monitor} title="Web" fields={LDAP_SERVICE_DETAILS} />

              {/* admin service details */}
              <ServiceDetailsSection icon={ShieldUser} title="Admin" fields={LDAP_ADMIN_SERVICE_DETAILS} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
