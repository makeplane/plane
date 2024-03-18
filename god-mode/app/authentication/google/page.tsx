"use client";

import { useState } from "react";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// hooks
import useInstance from "hooks/use-instance";
// ui
import { Loader, ToggleSwitch, setPromiseToast } from "@plane/ui";
// components
import { InstanceGoogleConfigForm } from "components/authentication";

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
    <div className="flex flex-col gap-4 max-w-6xl pb-6">
      <div className="flex items-center gap-4 mb-2 border-b border-custom-border-100 pb-3">
        <div className="grow">
          <div className="text-xl font-medium text-custom-text-100">Google</div>
          <div className="text-sm font-normal text-custom-text-300">
            Allow members to login or sign up to plane with their Google accounts.
          </div>
        </div>
        <div className={`shrink-0 ${(isSubmitting || !formattedConfig) && "opacity-70"}`}>
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
        </div>
      </div>
      {formattedConfig ? (
        <>
          <div className="pt-2 text-lg font-medium">Google configuration</div>
          <InstanceGoogleConfigForm config={formattedConfig} />
        </>
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
  );
});

export default InstanceGoogleAuthenticationPage;
