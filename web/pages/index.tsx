import React, { useEffect } from "react";

import Image from "next/image";

import type { NextPage } from "next";

// layouts
import DefaultLayout from "layouts/default-layout";
// services
import authenticationService from "services/authentication.service";
// hooks
import useUserAuth from "hooks/use-user-auth";
import useToast from "hooks/use-toast";
// components
import {
  GoogleLoginButton,
  GithubLoginButton,
  EmailCodeForm,
  EmailPasswordForm,
} from "components/account";
// ui
import { Spinner } from "components/ui";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// next themes
import { useTheme } from "next-themes";
import { IUser } from "types";
import getConfig from "next/config";

// types
type EmailPasswordFormValues = {
  email: string;
  password?: string;
  medium?: string;
};

const HomePage: NextPage = observer(() => {
  const store: any = useMobxStore();
  const { setTheme } = useTheme();

  const {
    publicRuntimeConfig: { NEXT_PUBLIC_ENABLE_OAUTH },
  } = getConfig()

  const { isLoading, mutateUser } = useUserAuth("sign-in");

  const { setToastAlert } = useToast();

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
      if (process.env.NEXT_PUBLIC_GITHUB_ID && credential) {
        const socialAuthPayload = {
          medium: "github",
          credential,
          clientId: process.env.NEXT_PUBLIC_GITHUB_ID,
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
              {parseInt(NEXT_PUBLIC_ENABLE_OAUTH || "0") ? (
                <>
                  <h1 className="text-center text-2xl sm:text-2.5xl font-semibold text-custom-text-100">
                    { `Sign in to Plane` }
                  </h1>
                  <div className="flex flex-col divide-y divide-custom-border-200">
                    <div className="pb-7">
                      <EmailCodeForm handleSignIn={handleEmailCodeSignIn} />
                    </div>
                    <div className="flex flex-col items-center justify-center gap-4 pt-7 sm:w-[360px] mx-auto overflow-hidden">
                      <GoogleLoginButton handleSignIn={handleGoogleSignIn} />
                      <GithubLoginButton handleSignIn={handleGitHubSignIn} />
                    </div>
                  </div>
                </>
              ) : (
                <EmailPasswordForm onSubmit={handlePasswordSignIn} />
              )}

              {parseInt(NEXT_PUBLIC_ENABLE_OAUTH || "0") ? (
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
              ) : null}
            </div>
          </div>
        </>
      )}
    </DefaultLayout>
  );
});

export default HomePage;
