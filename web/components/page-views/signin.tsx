import useSWR from "swr";
import { observer } from "mobx-react-lite";
import Image from "next/image";
import { useRouter } from "next/router";
// hooks
import useToast from "hooks/use-toast";
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { AuthService } from "services/auth.service";
import { AppConfigService } from "services/app_config.service";
// components
import {
  GoogleLoginButton,
  GithubLoginButton,
  EmailCodeForm,
  EmailPasswordForm,
  EmailPasswordFormValues,
} from "components/account";
// ui
import { Loader, Spinner } from "@plane/ui";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";
import { IUserSettings } from "types";
import { useState } from "react";

const appConfigService = new AppConfigService();
const authService = new AuthService();

export const SignInView = observer(() => {
  const { user: userStore } = useMobxStore();
  // router
  const router = useRouter();
  // states
  const [isLoading, setLoading] = useState(false);
  // toast
  const { setToastAlert } = useToast();
  // fetch app config
  const { data, error } = useSWR("APP_CONFIG", () => appConfigService.envConfig());
  // fetch user info
  useSWR("USER_INFO", () => userStore.fetchCurrentUser());
  // computed
  const enableEmailPassword =
    data &&
    (data?.email_password_login || !(data?.email_password_login || data?.magic_login || data?.google || data?.github));

  const handleLoginRedirection = () =>
    userStore
      .fetchCurrentUserSettings()
      .then((userSettings: IUserSettings) => {
        const workspaceSlug =
          userSettings?.workspace?.last_workspace_slug || userSettings?.workspace?.fallback_workspace_slug;
        router.push(`/${workspaceSlug}`);
      })
      .catch(() => {
        setLoading(false);
      });

  const handleGoogleSignIn = async ({ clientId, credential }: any) => {
    try {
      setLoading(true);
      if (clientId && credential) {
        const socialAuthPayload = {
          medium: "google",
          credential,
          clientId,
        };
        const response = await authService.socialAuth(socialAuthPayload);
        if (response) {
          handleLoginRedirection();
        }
      } else {
        setLoading(false);
        throw Error("Cant find credentials");
      }
    } catch (err: any) {
      setLoading(false);
      setToastAlert({
        title: "Error signing in!",
        type: "error",
        message: err?.error || "Something went wrong. Please try again later or contact the support team.",
      });
    }
  };

  const handleGitHubSignIn = async (credential: string) => {
    try {
      setLoading(true);
      if (data && data.github && credential) {
        const socialAuthPayload = {
          medium: "github",
          credential,
          clientId: data.github,
        };
        const response = await authService.socialAuth(socialAuthPayload);
        if (response) {
          handleLoginRedirection();
        }
      } else {
        setLoading(false);
        throw Error("Cant find credentials");
      }
    } catch (err: any) {
      setLoading(false);
      setToastAlert({
        title: "Error signing in!",
        type: "error",
        message: err?.error || "Something went wrong. Please try again later or contact the support team.",
      });
    }
  };

  const handlePasswordSignIn = (formData: EmailPasswordFormValues) => {
    setLoading(true);
    return authService
      .emailLogin(formData)
      .then(() => {
        handleLoginRedirection();
      })
      .catch((err) => {
        setLoading(false);
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error || "Something went wrong. Please try again later or contact the support team.",
        });
      });
  };

  const handleEmailCodeSignIn = async (response: any) => {
    try {
      setLoading(true);
      if (response) {
        handleLoginRedirection();
      }
    } catch (err: any) {
      setLoading(false);
      setToastAlert({
        type: "error",
        title: "Error!",
        message: err?.error || "Something went wrong. Please try again later or contact the support team.",
      });
    }
  };

  return (
    <>
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
                Sign in to Plane
              </h1>

              {!data && !error ? (
                <div className="pt-10 w-ful">
                  <Loader className="space-y-4 w-full pb-4">
                    <Loader.Item height="46px" width="360px" />
                    <Loader.Item height="46px" width="360px" />
                  </Loader>

                  <Loader className="space-y-4 w-full pt-4">
                    <Loader.Item height="46px" width="360px" />
                    <Loader.Item height="46px" width="360px" />
                  </Loader>
                </div>
              ) : (
                <>
                  <>
                    {enableEmailPassword && <EmailPasswordForm onSubmit={handlePasswordSignIn} />}
                    {data?.magic_login && (
                      <div className="flex flex-col divide-y divide-custom-border-200">
                        <div className="pb-7">
                          <EmailCodeForm handleSignIn={handleEmailCodeSignIn} />
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col items-center justify-center gap-4 pt-7 sm:w-[360px] mx-auto overflow-hidden">
                      {data?.google && <GoogleLoginButton clientId={data?.google} handleSignIn={handleGoogleSignIn} />}
                      {data?.github && <GithubLoginButton clientId={data?.github} handleSignIn={handleGitHubSignIn} />}
                    </div>
                  </>
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
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
});
