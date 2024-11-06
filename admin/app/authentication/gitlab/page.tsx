"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import useSWR from "swr";
import { Loader, ToggleSwitch, setPromiseToast } from "@plane/ui";
// components
import { AuthenticationMethodCard } from "@/components/authentication";
import { PageHeader } from "@/components/common";
// hooks
import { useInstance } from "@/hooks/store";
// icons
import GitlabLogo from "@/public/logos/gitlab-logo.svg";
// local components
import { InstanceGitlabConfigForm } from "./form";

const InstanceGitlabAuthenticationPage = observer(() => {
  // store
  const { fetchInstanceConfigurations, formattedConfig, updateInstanceConfigurations } = useInstance();
  // state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // config
  const enableGitlabConfig = formattedConfig?.IS_GITLAB_ENABLED ?? "";

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  const updateConfig = async (key: "IS_GITLAB_ENABLED", value: string) => {
    setIsSubmitting(true);

    const payload = {
      [key]: value,
    };

    const updateConfigPromise = updateInstanceConfigurations(payload);

    setPromiseToast(updateConfigPromise, {
      loading: "Saving Configuration...",
      success: {
        title: "Configuration saved",
        message: () => `GitLab authentication is now ${value ? "active" : "disabled"}.`,
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
      <PageHeader title="GitLab Authentication - Plane Web" />
      <div className="relative container mx-auto w-full h-full p-4 py-4 space-y-6 flex flex-col">
        <div className="border-b border-custom-border-100 mx-4 py-4 space-y-1 flex-shrink-0">
          <AuthenticationMethodCard
            name="GitLab"
            description="Allow members to login or sign up to plane with their GitLab accounts."
            icon={<Image src={GitlabLogo} height={24} width={24} alt="GitLab Logo" />}
            config={
              <ToggleSwitch
                value={Boolean(parseInt(enableGitlabConfig))}
                onChange={() => {
                  Boolean(parseInt(enableGitlabConfig)) === true
                    ? updateConfig("IS_GITLAB_ENABLED", "0")
                    : updateConfig("IS_GITLAB_ENABLED", "1");
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
            <InstanceGitlabConfigForm config={formattedConfig} />
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

export default InstanceGitlabAuthenticationPage;
