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

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// ui
import { setPromiseToast } from "@plane/propel/toast";
import { Switch } from "@plane/propel/switch";
import { Loader } from "@plane/ui";
// assets
import ldapLogo from "@/app/assets/logos/ldap.webp?url";
// components
import { AuthenticationMethodCard } from "@/components/authentication/authentication-method-card";
import { PageHeader } from "@/components/common/page-header";
import { PageWrapper } from "@/components/common/page-wrapper";
// hooks
import { useInstance } from "@/hooks/store";
// plane admin hooks
import { useInstanceFlag } from "@/plane-admin/hooks/store/use-instance-flag";
// local components
import { InstanceLDAPConfigForm } from "./form";
// types
import type { Route } from "./+types/page";

const InstanceLDAPAuthenticationPage = observer(() => {
  // state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // store
  const { fetchInstanceConfigurations, formattedConfig, updateInstanceConfigurations } = useInstance();
  // plane admin store
  const isLDAPEnabled = useInstanceFlag("LDAP_AUTH");
  // config
  const enableLDAPConfig = formattedConfig?.IS_LDAP_ENABLED ?? "";

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  const updateConfig = async (key: "IS_LDAP_ENABLED", value: string) => {
    setIsSubmitting(true);

    const payload = {
      [key]: value,
    };

    const updateConfigPromise = updateInstanceConfigurations(payload);

    setPromiseToast(updateConfigPromise, {
      loading: "Saving Configuration...",
      success: {
        title: "Configuration saved",
        message: () => `LDAP authentication is now ${value ? "active" : "disabled"}.`,
      },
      error: {
        title: "Error",
        message: () => "Failed to save configuration",
      },
    });

    await updateConfigPromise
      .then(() => {
        setIsSubmitting(false);
      })
      .catch((err) => {
        console.error(err);
        setIsSubmitting(false);
      });
  };

  if (isLDAPEnabled === false) {
    return (
      <div className="relative container mx-auto w-full h-full p-4 py-4 my-6 space-y-6 flex flex-col">
        <PageHeader title="Authentication - God Mode" />
        <div className="text-center text-lg text-gray-500">
          <p>LDAP authentication is not enabled for this instance.</p>
          <p>Activate any of your workspace to get this feature.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Authentication - God Mode" />
      <PageWrapper
        customHeader={
          <AuthenticationMethodCard
            name="LDAP"
            description="Authenticate your users via LDAP directory services."
            icon={<img src={ldapLogo} height={24} width={24} alt="LDAP Logo" />}
            config={
              <Switch
                value={Boolean(parseInt(enableLDAPConfig))}
                onChange={() => {
                  if (Boolean(parseInt(enableLDAPConfig)) === true) {
                    updateConfig("IS_LDAP_ENABLED", "0");
                  } else {
                    updateConfig("IS_LDAP_ENABLED", "1");
                  }
                }}
                disabled={isSubmitting || !formattedConfig}
              />
            }
            disabled={isSubmitting || !formattedConfig}
            withBorder={false}
          />
        }
      >
        {formattedConfig ? (
          <InstanceLDAPConfigForm config={formattedConfig} />
        ) : (
          <Loader className="space-y-8">
            <Loader.Item height="50px" width="25%" />
            <Loader.Item height="50px" />
            <Loader.Item height="50px" />
            <Loader.Item height="50px" />
            <Loader.Item height="50px" />
            <Loader.Item height="50px" width="50%" />
          </Loader>
        )}
      </PageWrapper>
    </>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "LDAP Authentication - God Mode" }];

export default InstanceLDAPAuthenticationPage;
