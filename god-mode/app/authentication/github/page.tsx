"use client";

import { useState } from "react";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// hooks
import useInstance from "hooks/use-instance";
// ui
import { Loader, ToggleSwitch, setPromiseToast } from "@plane/ui";
// components
import { InstanceGithubConfigForm } from "components/authentication";

const InstanceGithubAuthenticationPage = observer(() => {
  // store
  const {
    fetchInstanceConfigurations,
    formattedConfig,
    updateInstanceConfigurations,
  } = useInstance();
  // state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // config
  const enableGithubConfig = formattedConfig?.IS_GITHUB_ENABLED ?? "";

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  const updateConfig = async (key: "IS_GITHUB_ENABLED", value: string) => {
    setIsSubmitting(true);

    const payload = {
      [key]: value,
    };

    const updateConfigPromise = updateInstanceConfigurations(payload);

    setPromiseToast(updateConfigPromise, {
      loading: "Saving Configuration...",
      success: {
        title: "Configuration saved",
        message: () =>
          `Github authentication is now ${value ? "active" : "disabled"}.`,
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
    <div className="flex max-w-6xl flex-col gap-4 pb-6">
      <div className="mb-2 flex items-center gap-4 border-b border-custom-border-100 pb-3">
        <div className="grow">
          <div className="text-xl font-medium text-custom-text-100">Github</div>
          <div className="text-sm font-normal text-custom-text-300">
            Allow members to login or sign up to plane with their Github
            accounts.
          </div>
        </div>
        <div
          className={`shrink-0 ${
            (isSubmitting || !formattedConfig) && "opacity-70"
          }`}
        >
          <ToggleSwitch
            value={Boolean(parseInt(enableGithubConfig))}
            onChange={() => {
              Boolean(parseInt(enableGithubConfig)) === true
                ? updateConfig("IS_GITHUB_ENABLED", "0")
                : updateConfig("IS_GITHUB_ENABLED", "1");
            }}
            size="sm"
            disabled={isSubmitting || !formattedConfig}
          />
        </div>
      </div>
      {formattedConfig ? (
        <>
          <div className="pt-2 text-lg font-medium">Github configuration</div>
          <InstanceGithubConfigForm config={formattedConfig} />
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

export default InstanceGithubAuthenticationPage;
