"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// hooks
import useInstance from "hooks/use-instance";
// ui
import { Loader, ToggleSwitch, setPromiseToast } from "@plane/ui";
// types
import { TInstanceConfigurationKeys } from "@plane/types";
// icons
import { Mails, KeyRound } from "lucide-react";
import GoogleLogo from "/public/logos/google-logo.svg";
import githubLightModeImage from "/public/logos/github-black.png";
import githubDarkModeImage from "/public/logos/github-white.png";
// helpers
import { resolveGeneralTheme } from "helpers/common.helper";
// components
import {
  EmailCodesConfiguration,
  PasswordLoginConfiguration,
  GoogleConfiguration,
  GithubConfiguration,
} from "components/authentication";

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

  // Sign-up config
  const enableSignup = formattedConfig?.ENABLE_SIGNUP ?? "";

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
    <div className="flex max-w-6xl flex-col gap-4 pb-6">
      <div className="mb-2 border-b border-custom-border-100 pb-3">
        <div className="text-xl font-medium text-custom-text-100">Manage authentication for your instance</div>
        <div className="text-sm font-normal text-custom-text-300">
          Configure authentication modes for your team and restrict sign ups to be invite only.
        </div>
      </div>
      {formattedConfig ? (
        <>
          <div className="pt-2 text-lg font-medium">Sign-up configuration</div>
          <div className="mr-4 flex items-center gap-14">
            <div className="grow">
              <div className="text-sm font-medium leading-5 text-custom-text-100">
                Allow anyone to sign up without invite
              </div>
              <div className="text-xs font-normal leading-5 text-custom-text-300">
                Toggling this off will disable self sign ups.
              </div>
            </div>
            <div className={`shrink-0 ${isSubmitting && "opacity-70"}`}>
              <ToggleSwitch
                value={Boolean(parseInt(enableSignup))}
                onChange={() => {
                  Boolean(parseInt(enableSignup)) === true
                    ? updateConfig("ENABLE_SIGNUP", "0")
                    : updateConfig("ENABLE_SIGNUP", "1");
                }}
                size="sm"
                disabled={isSubmitting}
              />
            </div>
          </div>
          {/* Authentication modes */}
          <div className="pt-8 text-lg font-medium">Authentication modes</div>
          {authenticationMethodsCard.map((method) => (
            <div
              key={method.key}
              className="flex items-center gap-14 rounded border border-custom-border-200 px-4 py-3"
            >
              <div className="flex grow items-center gap-4">
                <div className="shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-custom-background-80">
                    {method.icon}
                  </div>
                </div>
                <div className="grow">
                  <div className="text-sm font-medium leading-5 text-custom-text-100">{method.name}</div>
                  <div className="text-xs font-normal leading-5 text-custom-text-300">{method.description}</div>
                </div>
              </div>
              <div className={`shrink-0 ${isSubmitting && "opacity-70"}`}>{method.config}</div>
            </div>
          ))}
        </>
      ) : (
        <Loader className="space-y-4">
          <Loader.Item height="50px" width="50%" />
          <Loader.Item height="50px" width="25%" />
          <Loader.Item height="50px" />
          <Loader.Item height="50px" width="25%" />
          <Loader.Item height="50px" />
          <Loader.Item height="50px" />
          <Loader.Item height="50px" />
        </Loader>
      )}
    </div>
  );
});

export default InstanceAuthenticationPage;
