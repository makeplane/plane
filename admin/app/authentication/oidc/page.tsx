"use client";

import { useState } from "react";
import Image from "next/image";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// hooks
import { useInstance } from "@/hooks/store";
// ui
import { Loader, ToggleSwitch, setPromiseToast } from "@plane/ui";
// components
import { PageHeader } from "@/components/common";
import { AuthenticationMethodCard } from "@/components/authentication";
import { InstanceOIDCConfigForm } from "./form";
// icons
import OIDCLogo from "/public/logos/oidc-logo.svg";

const InstanceOIDCAuthenticationPage = observer(() => {
  // store
  const { fetchInstanceConfigurations, formattedConfig, updateInstanceConfigurations } = useInstance();
  // state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
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
