"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import useSWR from "swr";
// ui
import { Loader, ToggleSwitch, setPromiseToast } from "@plane/ui";
// components
import { AuthenticationMethodCard } from "@/components/authentication/authentication-method-card";
import { PageHeader } from "@/components/common/page-header";
// hooks
import { useInstance } from "@/hooks/store";
// icons
import OIDCLogo from "/public/logos/oidc-logo.svg";
// plane admin hooks
import { useInstanceFlag } from "@/plane-admin/hooks/store/use-instance-flag";
// local components
import { InstanceOIDCConfigForm } from "./form";

const InstanceOIDCAuthenticationPage = observer(() => {
  // state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // store
  const { fetchInstanceConfigurations, formattedConfig, updateInstanceConfigurations } = useInstance();
  // plane admin store
  const isOIDCEnabled = useInstanceFlag("OIDC_SAML_AUTH");
  // config
  const enableOIDCConfig = formattedConfig?.IS_OIDC_ENABLED ?? "";

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  const updateConfig = async (key: "IS_OIDC_ENABLED", value: string) => {
    setIsSubmitting(true);

    const payload = {
      [key]: value,
    };

    const updateConfigPromise = updateInstanceConfigurations(payload);

    setPromiseToast(updateConfigPromise, {
      loading: "Saving Configuration...",
      success: {
        title: "Configuration saved",
        message: () => `OIDC authentication is now ${value ? "active" : "disabled"}.`,
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

  if (isOIDCEnabled === false) {
    return (
      <div className="relative container mx-auto w-full h-full p-4 py-4 my-6 space-y-6 flex flex-col">
        <PageHeader title="Authentication - God Mode" />
        <div className="text-center text-lg text-gray-500">
          <p>OpenID Connect (OIDC) authentication is not enabled for this instance.</p>
          <p>Activate any of your workspace to get this feature.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Authentication - God Mode" />
      <div className="relative container mx-auto w-full h-full p-4 py-4 space-y-6 flex flex-col">
        <div className="border-b border-custom-border-100 mx-4 py-4 space-y-1 flex-shrink-0">
          <AuthenticationMethodCard
            name="OIDC"
            description="Authenticate your users via the OpenID connect protocol."
            icon={<Image src={OIDCLogo} height={24} width={24} alt="OIDC Logo" />}
            config={
              <ToggleSwitch
                value={Boolean(parseInt(enableOIDCConfig))}
                onChange={() => {
                  Boolean(parseInt(enableOIDCConfig)) === true
                    ? updateConfig("IS_OIDC_ENABLED", "0")
                    : updateConfig("IS_OIDC_ENABLED", "1");
                }}
                size="sm"
                disabled={isSubmitting || !formattedConfig}
              />
            }
            disabled={isSubmitting || !formattedConfig}
            withBorder={false}
          />
        </div>
        <div className="flex-grow overflow-hidden overflow-y-scroll vertical-scrollbar scrollbar-md px-4">
          {formattedConfig ? (
            <InstanceOIDCConfigForm config={formattedConfig} />
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
        </div>
      </div>
    </>
  );
});

export default InstanceOIDCAuthenticationPage;
