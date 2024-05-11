"use client";

import { useState } from "react";
import Image from "next/image";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// hooks
import useInstance from "hooks/use-instance";
// ui
import { Loader, ToggleSwitch, setPromiseToast } from "@plane/ui";
// components
import { AuthenticationMethodCard, InstanceOIDCConfigForm } from "components/authentication";
// icons
import OIDCLogo from "/public/logos/oidc-logo.png";

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
    <div className="flex flex-col gap-4 max-w-6xl pb-6 md:px-2">
      <div className="flex items-center gap-4 mb-2 border-b border-custom-border-100 pb-3">
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
  );
});

export default InstanceOIDCAuthenticationPage;
