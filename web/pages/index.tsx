import React, { useEffect, useState } from "react";
import Image from "next/image";
import type { NextPage } from "next";
import { useTheme } from "next-themes";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// layouts
import DefaultLayout from "layouts/default-layout";
// services
import authenticationService from "services/authentication.service";
import { AppConfigService } from "services/app-config.service";
// hooks
import useUserAuth from "hooks/use-user-auth";
import useToast from "hooks/use-toast";
// components
import {
  GoogleLoginButton,
  GithubLoginButton,
  EmailCodeForm,
  EmailPasswordForm,
  EmailResetPasswordForm,
} from "components/account";
// ui
import { Spinner } from "components/ui";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// types
import { IUser } from "types";

const appConfig = new AppConfigService();

// types
type EmailPasswordFormValues = {
  email: string;
  password?: string;
  medium?: string;
};

const HomePage: NextPage = observer(() => {
  const store: any = useMobxStore();
  // theme
  const { setTheme } = useTheme();
  // user
  const { isLoading, mutateUser } = useUserAuth("sign-in");
  // states
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  // toast
  const { setToastAlert } = useToast();
  // fetch app config
  const { data } = useSWR("APP_CONFIG", () => appConfig.envConfig());

  const handleTheme = (user: IUser) => {
    const currentTheme = user.theme.theme ?? "system";
    setTheme(currentTheme);
    store?.user?.setCurrentUserSettings();
  };

  const handleGoogleSignIn = async ({ clientId, credential }: any) => {
    try {
      if (clientId && credential) {
        const socialAuthPayload = {
          medium: "google",
          credential,
          clientId,
        };
        const response = await authenticationService.socialAuth(socialAuthPayload);
        if (response && response?.user) {
          mutateUser();
          handleTheme(response?.user);
        }
      } else {
        throw Error("Cant find credentials");
      }
    } catch (err: any) {
      setToastAlert({
        title: "Error signing in!",
        type: "error",
        message:
          err?.error || "Something went wrong. Please try again later or contact the support team.",
      });
    }
  };

  const handleGitHubSignIn = async (credential: string) => {
    try {
      if (data && data.github && credential) {
        const socialAuthPayload = {
          medium: "github",
          credential,
          clientId: data.github,
        };
        const response = await authenticationService.socialAuth(socialAuthPayload);
        if (response && response?.user) {
          mutateUser();
          handleTheme(response?.user);
        }
      } else {
        throw Error("Cant find credentials");
      }
    } catch (err: any) {
      setToastAlert({
        title: "Error signing in!",
        type: "error",
        message:
          err?.error || "Something went wrong. Please try again later or contact the support team.",
      });
    }
  };

  const handlePasswordSignIn = async (formData: EmailPasswordFormValues) => {
    await authenticationService
      .emailLogin(formData)
      .then((response) => {
        try {
          if (response) {
            mutateUser();
            handleTheme(response?.user);
          }
        } catch (err: any) {
          setToastAlert({
            type: "error",
            title: "Error!",
            message:
              err?.error ||
              "Something went wrong. Please try again later or contact the support team.",
          });
        }
      })
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message:
            err?.error ||
            "Something went wrong. Please try again later or contact the support team.",
        })
      );
  };

  const handleEmailCodeSignIn = async (response: any) => {
    try {
      if (response) {
        mutateUser();
        handleTheme(response?.user);
      }
    } catch (err: any) {
      setToastAlert({
        type: "error",
        title: "Error!",
        message:
          err?.error || "Something went wrong. Please try again later or contact the support team.",
      });
    }
  };

  useEffect(() => {
    setTheme("system");
  }, [setTheme]);

  return (
    <DefaultLayout>
      {isLoading ? (
        <div className="grid place-items-center h-screen">
          <Spinner />
        </div>
      ) : (
        <>
          <>
            <div className="hidden sm:block sm:fixed border-r-[0.5px] border-custom-border-200 h-screen w-[0.5px] top-0 left-20 lg:left-32" />
            <div className="fixed grid place-items-center bg-custom-background-100 sm:py-5 top-11 sm:top-12 left-7 sm:left-16 lg:left-28">
              <div className="grid place-items-center bg-custom-background-100">
                <div className="h-[30px] w-[30px]">
                  <Image src={BluePlaneLogoWithoutText} alt="Plane Logo" />
                </div>
              </div>
            </div>
          </>
          <div className="grid place-items-center h-full overflow-y-auto py-5 px-7">
            <div>
              <h1 className="text-center text-2xl sm:text-2.5xl font-semibold text-custom-text-100">
                {isResettingPassword ? "Reset your password" : "Sign in to Plane"}
              </h1>
              {isResettingPassword ? (
                <EmailResetPasswordForm setIsResettingPassword={setIsResettingPassword} />
              ) : (
                <>
                  {data?.email_password_login && (
                    <EmailPasswordForm
                      onSubmit={handlePasswordSignIn}
                      setIsResettingPassword={setIsResettingPassword}
                    />
                  )}
                  {data?.magic_login && (
                    <div className="flex flex-col divide-y divide-custom-border-200">
                      <div className="pb-7">
                        <EmailCodeForm handleSignIn={handleEmailCodeSignIn} />
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col items-center justify-center gap-4 pt-7 sm:w-[360px] mx-auto overflow-hidden">
                    {data?.google && (
                      <GoogleLoginButton
                        clientId={data?.google}
                        handleSignIn={handleGoogleSignIn}
                      />
                    )}
                    {data?.github && (
                      <GithubLoginButton
                        clientId={data?.github}
                        handleSignIn={handleGitHubSignIn}
                      />
                    )}
                  </div>
                </>
              )}

              <p className="pt-16 text-custom-text-200 text-sm text-center">
                By signing up, you agree to the{" "}
                <a
                  href="https://plane.so/terms-and-conditions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline"
                >
                  Terms & Conditions
                </a>
              </p>
            </div>
          </div>
        </>
      )}
    </DefaultLayout>
  );
});

export default HomePage;
