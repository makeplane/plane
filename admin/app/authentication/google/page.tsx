"use client";

import { useState } from "react";
import { observer } from "mobx-react-lite";
import Image from "next/image";
import useSWR from "swr";
import { Loader, ToggleSwitch, setPromiseToast } from "@plane/ui";
// components
import { PageHeader } from "@/components/core";
// hooks
import { useInstance } from "@/hooks/store";
// icons
import GoogleLogo from "@/public/logos/google-logo.svg";
// local components
import { AuthenticationMethodCard } from "../components";
import { InstanceGoogleConfigForm } from "./form";

const InstanceGoogleAuthenticationPage = observer(() => {
  // store
  const { fetchInstanceConfigurations, formattedConfig, updateInstanceConfigurations } = useInstance();
  // state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // config
  const enableGoogleConfig = formattedConfig?.IS_GOOGLE_ENABLED ?? "";

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  const updateConfig = async (key: "IS_GOOGLE_ENABLED", value: string) => {
    setIsSubmitting(true);

    const payload = {
      [key]: value,
    };

    const updateConfigPromise = updateInstanceConfigurations(payload);

    setPromiseToast(updateConfigPromise, {
      loading: "Saving Configuration...",
      success: {
        title: "Configuration saved",
        message: () => `Google authentication is now ${value ? "active" : "disabled"}.`,
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
      <div className="relative container mx-auto w-full h-full p-8 py-4 space-y-6 flex flex-col">
        <div className="border-b border-custom-border-100 pb-3 space-y-1 flex-shrink-0">
          <AuthenticationMethodCard
            name="Google"
            description="Allow members to login or sign up to plane with their Google
            accounts."
            icon={<Image src={GoogleLogo} height={24} width={24} alt="Google Logo" />}
            config={
              <ToggleSwitch
                value={Boolean(parseInt(enableGoogleConfig))}
                onChange={() => {
                  Boolean(parseInt(enableGoogleConfig)) === true
                    ? updateConfig("IS_GOOGLE_ENABLED", "0")
                    : updateConfig("IS_GOOGLE_ENABLED", "1");
                }}
                size="sm"
                disabled={isSubmitting || !formattedConfig}
              />
            }
            disabled={isSubmitting || !formattedConfig}
            withBorder={false}
          />
        </div>
        <div className="flex-grow overflow-hidden overflow-y-auto">
          {formattedConfig ? (
            <InstanceGoogleConfigForm config={formattedConfig} />
          ) : (
            <Loader className="space-y-8">
              <Loader.Item height="50px" width="25%" />
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

export default InstanceGoogleAuthenticationPage;
