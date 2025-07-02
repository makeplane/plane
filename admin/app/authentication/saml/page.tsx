"use client";

import { useState } from "react";
import { observer } from "mobx-react-lite";
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
import SAMLLogo from "/public/logos/saml-logo.svg";
// plane admin hooks
import { useInstanceFlag } from "@/plane-admin/hooks/store/use-instance-flag";
// local components
import { InstanceSAMLConfigForm } from "./form";

const InstanceSAMLAuthenticationPage = observer(() => {
  // state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // store
  const { fetchInstanceConfigurations, formattedConfig, updateInstanceConfigurations } = useInstance();
  // plane admin store
  const isSAMLEnabled = useInstanceFlag("OIDC_SAML_AUTH");
  // config
  const enableSAMLConfig = formattedConfig?.IS_SAML_ENABLED ?? "";

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  const updateConfig = async (key: "IS_SAML_ENABLED", value: string) => {
    setIsSubmitting(true);

    const payload = {
      [key]: value,
    };

    const updateConfigPromise = updateInstanceConfigurations(payload);

    setPromiseToast(updateConfigPromise, {
      loading: "Saving Configuration...",
      success: {
        title: "Configuration saved",
        message: () => `SAML authentication is now ${value ? "active" : "disabled"}.`,
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

  if (isSAMLEnabled === false) {
    return (
      <div className="relative container mx-auto w-full h-full p-4 py-4 my-6 space-y-6 flex flex-col">
        <PageHeader title="Authentication - God Mode" />
        <div className="text-center text-lg text-gray-500">
          <p>Security Assertion Markup Language (SAML) authentication is not enabled for this instance.</p>
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
            name="SAML"
            description="Authenticate your users via Security Assertion Markup Language
          protocol."
            icon={<Image src={SAMLLogo} height={24} width={24} alt="SAML Logo" className="pl-0.5" />}
            config={
              <ToggleSwitch
                value={Boolean(parseInt(enableSAMLConfig))}
                onChange={() => {
                  Boolean(parseInt(enableSAMLConfig)) === true
                    ? updateConfig("IS_SAML_ENABLED", "0")
                    : updateConfig("IS_SAML_ENABLED", "1");
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
            <InstanceSAMLConfigForm config={formattedConfig} />
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

export default InstanceSAMLAuthenticationPage;
