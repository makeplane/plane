import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
// assets
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.svg";
// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// services
import authenticationService from "services/authentication.service";
// hooks
import useToast from "hooks/use-toast";
// components
import { EmailPasswordForm, GithubLoginButton, GoogleLoginButton, EmailCodeForm } from "components/accounts";

const HomePage = () => {
  const { user: userStore } = useMobxStore();

  const router = useRouter();
  const { next_path } = router.query;

  const { setToastAlert } = useToast();

  const onSignInError = (error: any) => {
    setToastAlert({
      title: "Error signing in!",
      type: "error",
      message: error?.error || "Something went wrong. Please try again later or contact the support team.",
    });
  };

  const onSignInSuccess = (response: any) => {
    const isOnboarded = response?.user?.onboarding_step?.profile_complete || false;

    userStore.setCurrentUser(response?.user);

    if (!isOnboarded) {
      router.push(`/onboarding?next_path=${next_path}`);
      return;
    }
    router.push((next_path ?? "/").toString());
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

        onSignInSuccess(response);
      } else {
        throw Error("Cant find credentials");
      }
    } catch (err: any) {
      onSignInError(err);
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
        onSignInSuccess(response);
      } else {
        throw Error("Cant find credentials");
      }
    } catch (err: any) {
      onSignInError(err);
    }
  };

  const handlePasswordSignIn = async (formData: any) => {
    await authenticationService
      .emailLogin(formData)
      .then((response) => {
        try {
          if (response) {
            onSignInSuccess(response);
          }
        } catch (err: any) {
          onSignInError(err);
        }
      })
      .catch((err) => onSignInError(err));
  };

  const handleEmailCodeSignIn = async (response: any) => {
    try {
      if (response) {
        onSignInSuccess(response);
      }
    } catch (err: any) {
      onSignInError(err);
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden">
      <div className="hidden sm:block sm:fixed border-r-[0.5px] border-custom-border-200 h-screen w-[0.5px] top-0 left-20 lg:left-32" />
      <div className="fixed grid place-items-center bg-custom-background-100 sm:py-5 top-11 sm:top-12 left-7 sm:left-16 lg:left-28">
        <div className="grid place-items-center bg-custom-background-100">
          <div className="h-[30px] w-[30px]">
            <Image src={BluePlaneLogoWithoutText} alt="Plane Logo" />
          </div>
        </div>
      </div>
      <div className="grid place-items-center h-full overflow-y-auto py-5 px-7">
        <div>
          {parseInt(process.env.NEXT_PUBLIC_ENABLE_OAUTH || "0") ? (
            <>
              <h1 className="text-center text-2xl sm:text-2.5xl font-semibold text-custom-text-100">
                Sign in to Plane
              </h1>
              <div className="flex flex-col divide-y divide-custom-border-200">
                <div className="pb-7">
                  <EmailCodeForm handleSignIn={handleEmailCodeSignIn} />
                </div>
                <div className="flex flex-col items-center justify-center gap-4 pt-7 sm:w-[360px] mx-auto overflow-hidden">
                  <GoogleLoginButton handleSignIn={handleGoogleSignIn} />
                  {/* <GithubLoginButton handleSignIn={handleGitHubSignIn} /> */}
                </div>
              </div>
            </>
          ) : (
            <EmailPasswordForm onSubmit={handlePasswordSignIn} />
          )}

          {parseInt(process.env.NEXT_PUBLIC_ENABLE_OAUTH || "0") ? (
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
    </div>
  );
};

export default HomePage;
