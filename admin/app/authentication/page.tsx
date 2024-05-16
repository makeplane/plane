"use client";

import { useState } from "react";
import { observer } from "mobx-react-lite";
import Image from "next/image";
import { useTheme } from "next-themes";
import useSWR from "swr";
import { Mails, KeyRound } from "lucide-react";
import { TInstanceConfigurationKeys } from "@plane/types";
import { Loader, setPromiseToast } from "@plane/ui";
// components
import { PageHeader } from "@/components/core";
// hooks
// helpers
import { resolveGeneralTheme } from "@/helpers/common.helper";
import { useInstance } from "@/hooks/store";
// images
import githubLightModeImage from "@/public/logos/github-black.png";
import githubDarkModeImage from "@/public/logos/github-white.png";
import GoogleLogo from "@/public/logos/google-logo.svg";
// local components
import {
  AuthenticationMethodCard,
  EmailCodesConfiguration,
  PasswordLoginConfiguration,
  GithubConfiguration,
  GoogleConfiguration,
} from "./components";

type TInstanceAuthenticationMethodCard = {
  key: string;
  name: string;
  description: string;
  icon: JSX.Element;
  config: JSX.Element;
};

const InstanceAuthenticationPage = observer(() => {
  // store
  const { fetchInstanceConfigurations, formattedConfig, updateInstanceConfigurations } = useInstance();

  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());

  // state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // theme
  const { resolvedTheme } = useTheme();

  const updateConfig = async (key: TInstanceConfigurationKeys, value: string) => {
    setIsSubmitting(true);

    const payload = {
      [key]: value,
    };

    const updateConfigPromise = updateInstanceConfigurations(payload);

    setPromiseToast(updateConfigPromise, {
      loading: "Saving Configuration...",
      success: {
        title: "Success",
        message: () => "Configuration saved successfully",
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

  // Authentication methods
  const authenticationMethodsCard: TInstanceAuthenticationMethodCard[] = [
    {
      key: "email-codes",
      name: "Email codes",
      description: "Login or sign up using codes sent via emails. You need to have email setup here and enabled.",
      icon: <Mails className="h-6 w-6 p-0.5 text-custom-text-300/80" />,
      config: <EmailCodesConfiguration disabled={isSubmitting} updateConfig={updateConfig} />,
    },
    {
      key: "password-login",
      name: "Password based login",
      description: "Allow members to create accounts with passwords for emails to sign in.",
      icon: <KeyRound className="h-6 w-6 p-0.5 text-custom-text-300/80" />,
      config: <PasswordLoginConfiguration disabled={isSubmitting} updateConfig={updateConfig} />,
    },
    {
      key: "google",
      name: "Google",
      description: "Allow members to login or sign up to plane with their Google accounts.",
      icon: <Image src={GoogleLogo} height={20} width={20} alt="Google Logo" />,
      config: <GoogleConfiguration disabled={isSubmitting} updateConfig={updateConfig} />,
    },
    {
      key: "github",
      name: "Github",
      description: "Allow members to login or sign up to plane with their Github accounts.",
      icon: (
        <Image
          src={resolveGeneralTheme(resolvedTheme) === "dark" ? githubDarkModeImage : githubLightModeImage}
          height={20}
          width={20}
          alt="GitHub Logo"
        />
      ),
      config: <GithubConfiguration disabled={isSubmitting} updateConfig={updateConfig} />,
    },
  ];

  return (
    <>
      <PageHeader title="Authentication - God Mode" />
      <div className="relative container mx-auto w-full h-full p-8 py-4 space-y-6 flex flex-col">
        <div className="border-b border-custom-border-100 pb-3 space-y-1 flex-shrink-0">
          <div className="text-xl font-medium text-custom-text-100">Manage authentication for your instance</div>
          <div className="text-sm font-normal text-custom-text-300">
            Configure authentication modes for your team and restrict sign ups to be invite only.
          </div>
        </div>
        <div className="flex-grow overflow-hidden overflow-y-auto">
          {formattedConfig ? (
            <div className="space-y-3">
              <div className="text-lg font-medium">Authentication modes</div>
              {authenticationMethodsCard.map((method) => (
                <AuthenticationMethodCard
                  key={method.key}
                  name={method.name}
                  description={method.description}
                  icon={method.icon}
                  config={method.config}
                  disabled={isSubmitting}
                />
              ))}
            </div>
          ) : (
            <Loader className="space-y-10">
              <Loader.Item height="50px" width="75%" />
              <Loader.Item height="50px" width="75%" />
              <Loader.Item height="50px" width="40%" />
              <Loader.Item height="50px" width="40%" />
              <Loader.Item height="50px" width="20%" />
            </Loader>
          )}
        </div>
      </div>
    </>
  );
});

export default InstanceAuthenticationPage;
