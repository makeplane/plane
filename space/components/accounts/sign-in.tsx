import React from "react";
import useSWR from "swr";
import { useRouter } from "next/router";
// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// services
import authenticationService from "services/authentication.service";
import { AppConfigService } from "services/app-config.service";
// hooks
import useToast from "hooks/use-toast";
// components
import { EmailPasswordForm, GoogleLoginButton, EmailCodeForm } from "components/accounts";
// images
const imagePrefix = Boolean(parseInt(process.env.NEXT_PUBLIC_DEPLOY_WITH_NGINX || "0")) ? "/spaces" : "";

const appConfig = new AppConfigService();

export const SignInView = observer(() => {
  const { user: userStore } = useMobxStore();
  // router
  const router = useRouter();
  const { next_path } = router.query as { next_path: string };
  // toast
  const { setToastAlert } = useToast();
  // fetch app config
  const { data } = useSWR("APP_CONFIG", () => appConfig.envConfig());

  const onSignInError = (error: any) => {
    setToastAlert({
      title: "Error signing in!",
      type: "error",
      message: error?.error || "Something went wrong. Please try again later or contact the support team.",
    });
  };

  const onSignInSuccess = (response: any) => {
    userStore.setCurrentUser(response?.user);

    const isOnboard = response?.user?.onboarding_step?.profile_complete || false;

    if (isOnboard) {
      if (next_path) router.push(next_path);
      else router.push("/login");
    } else {
      if (next_path) router.push(`/onboarding?next_path=${next_path}`);
      else router.push("/onboarding");
    }
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
            <img src={`${imagePrefix}/plane-logos/blue-without-text.png`} alt="Plane Logo" />
          </div>
        </div>
      </div>
      <div className="grid place-items-center h-full overflow-y-auto py-5 px-7">
        <div>
          <h1 className="text-center text-2xl sm:text-2.5xl font-semibold text-custom-text-100">Sign in to Plane</h1>
          {data?.email_password_login && <EmailPasswordForm onSubmit={handlePasswordSignIn} />}

          {data?.magic_login && (
            <div className="flex flex-col divide-y divide-custom-border-200">
              <div className="pb-7">
                <EmailCodeForm handleSignIn={handleEmailCodeSignIn} />
              </div>
            </div>
          )}

          <div className="flex flex-col items-center justify-center gap-4 pt-7 sm:w-[360px] mx-auto overflow-hidden">
            {data?.google && <GoogleLoginButton clientId={data.google} handleSignIn={handleGoogleSignIn} />}
          </div>

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
    </div>
  );
});
