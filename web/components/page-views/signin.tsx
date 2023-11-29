import { useState, useEffect, useCallback } from "react";
import { observer } from "mobx-react-lite";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useRouter } from "next/router";
import { Lightbulb } from "lucide-react";
// hooks
import useToast from "hooks/use-toast";
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { AuthService } from "services/auth.service";
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
import signInIssues from "public/onboarding/onboarding-issues.svg";
// types
import { IUser, IUserSettings } from "types";

export type AuthType = "sign-in" | "sign-up";

const authService = new AuthService();

export const SignInView = observer(() => {
  // store
  const {
    user: { fetchCurrentUser, fetchCurrentUserSettings },
    appConfig: { envConfig },
  } = useMobxStore();
  // router
  const router = useRouter();
  const { next: next_url } = router.query as { next: string };
  // states
  const [isLoading, setLoading] = useState(false);
  const [authType, setAuthType] = useState<AuthType>("sign-in");
  // toast
  const { setToastAlert } = useToast();
  const { resolvedTheme } = useTheme();

  // computed.
  const enableEmailPassword =
    envConfig &&
    (envConfig?.email_password_login ||
      !(
        envConfig?.email_password_login ||
        envConfig?.magic_login ||
        envConfig?.google_client_id ||
        envConfig?.github_client_id
      ));

  const handleLoginRedirection = useCallback(
    (user: IUser) => {
      // if the user is not onboarded, redirect them to the onboarding page
      if (!user.is_onboarded) {
        router.push("/onboarding");
        return;
      }
      // if next_url is provided, redirect the user to that url
      if (next_url) {
        router.push(next_url);
        return;
      }

      // if the user is onboarded, fetch their last workspace details
      fetchCurrentUserSettings()
        .then((userSettings: IUserSettings) => {
          const workspaceSlug =
            userSettings?.workspace?.last_workspace_slug || userSettings?.workspace?.fallback_workspace_slug;
          if (workspaceSlug) router.push(`/${workspaceSlug}`);
          else router.push("/profile");
        })
        .catch(() => {
          setLoading(false);
        });
    },
    [fetchCurrentUserSettings, router, next_url]
  );

  const mutateUserInfo = useCallback(() => {
    fetchCurrentUser().then((user) => {
      handleLoginRedirection(user);
    });
  }, [fetchCurrentUser, handleLoginRedirection]);

  useEffect(() => {
    mutateUserInfo();
  }, [mutateUserInfo]);

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
          mutateUserInfo();
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
      if (envConfig && envConfig.github_client_id && credential) {
        const socialAuthPayload = {
          medium: "github",
          credential,
          clientId: envConfig.github_client_id,
        };
        const response = await authService.socialAuth(socialAuthPayload);
        if (response) {
          mutateUserInfo();
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
        mutateUserInfo();
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
        mutateUserInfo();
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
        <div className={`bg-onboarding-gradient-100 h-full w-full`}>
          <div className="flex items-center justify-between sm:py-5 px-8 pb-4 sm:px-16 lg:px-28 ">
            <div className="flex gap-x-2 py-10 items-center">
              <Image src={BluePlaneLogoWithoutText} height={30} width={30} alt="Plane Logo" className="mr-2" />
              <span className="font-semibold text-2xl sm:text-3xl">Plane</span>
            </div>

            {/* <div className="">
              {authType === "sign-in" && (
                <div className="mx-auto text-right text-onboarding-text-300 text-sm">
                  New to Plane?{" "}
                  <p
                    className="text-custom-primary-100 hover text-base font-medium hover:cursor-pointer"
                    onClick={() => {
                      setAuthType("sign-up");
                    }}
                  >
                    Create a new account
                  </p>
                </div>
              )}
            </div> */}
          </div>

          <div className="h-full bg-onboarding-gradient-100 md:w-2/3 sm:w-4/5 px-4 pt-4 rounded-t-md mx-auto shadow-sm border-x border-t border-custom-border-200 ">
            <div className={`px-7 sm:px-0 bg-onboarding-gradient-200 h-full pt-24 pb-56 rounded-t-md overflow-auto`}>
              {!envConfig ? (
                <div className="pt-10 mx-auto flex justify-center">
                  <div>
                    <Loader className="space-y-4 w-full pb-4 mx-auto">
                      <Loader.Item height="46px" width="360px" />
                      <Loader.Item height="46px" width="360px" />
                    </Loader>

                    <Loader className="space-y-4 w-full pt-4 mx-auto">
                      <Loader.Item height="46px" width="360px" />
                      <Loader.Item height="46px" width="360px" />
                    </Loader>
                  </div>
                </div>
              ) : (
                <>
                  <>
                    {enableEmailPassword && <EmailPasswordForm onSubmit={handlePasswordSignIn} />}
                    {envConfig?.magic_login && (
                      <div className="sm:w-96 mx-auto flex flex-col divide-y divide-custom-border-200">
                        <div className="pb-2">
                          <EmailCodeForm authType={authType} handleSignIn={handleEmailCodeSignIn} />
                        </div>
                      </div>
                    )}
                    <div className="flex sm:w-96 items-center mt-4 mx-auto">
                      <hr className={`border-onboarding-border-100 w-full`} />
                      <p className="text-center text-sm text-onboarding-text-400 mx-3 flex-shrink-0">
                        Or continue with
                      </p>
                      <hr className={`border-onboarding-border-100 w-full`} />
                    </div>
                    <div className="flex flex-col items-center justify-center gap-4 pt-7 sm:flex-row sm:w-96 mx-auto overflow-hidden">
                      {envConfig?.google_client_id && (
                        <GoogleLoginButton clientId={envConfig?.google_client_id} handleSignIn={handleGoogleSignIn} />
                      )}
                      {envConfig?.github_client_id && (
                        <GithubLoginButton
                          authType={authType}
                          clientId={envConfig?.github_client_id}
                          handleSignIn={handleGitHubSignIn}
                        />
                      )}
                    </div>
                    {/* {authType === "sign-up" && (
                      <div className="sm:w-96 text-center mx-auto mt-6 text-onboarding-text-400 text-sm">
                        Already using Plane?{" "}
                        <span
                          className="text-custom-primary-80 hover text-sm font-medium underline hover:cursor-pointer"
                          onClick={() => {
                            setAuthType("sign-in");
                          }}
                        >
                          Sign in
                        </span>
                      </div>
                    )} */}
                  </>
                  <div
                    className={`flex py-2 bg-onboarding-background-100 border border-onboarding-border-200 mx-auto rounded-[3.5px] sm:w-96 mt-16`}
                  >
                    <Lightbulb className="h-7 w-7 mr-2 mx-3" />
                    <p className={`text-sm text-left text-onboarding-text-100`}>
                      Try the latest features, like Tiptap editor, to write compelling responses.{" "}
                      <span className="font-medium text-sm underline hover:cursor-pointer" onClick={() => {}}>
                        See new features
                      </span>
                    </p>
                  </div>
                  <div className="flex justify-center border border-onboarding-border-200 sm:w-96 sm:h-52 object-cover mt-8 mx-auto rounded-md bg-onboarding-background-100 ">
                    <Image
                      src={signInIssues}
                      alt="Plane Issues"
                      className={`flex object-cover rounded-md ${
                        resolvedTheme === "dark" ? "bg-onboarding-background-100" : "bg-custom-primary-70"
                      } `}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
});
