import { useState, useEffect, useCallback } from "react";
import { observer } from "mobx-react-lite";
import Image from "next/image";
import { useRouter } from "next/router";
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
// icons
import { Lightbulb } from "lucide-react";

const authService = new AuthService();

export const SignInView = observer(() => {
  const {
    user: { fetchCurrentUser, fetchCurrentUserSettings },
    appConfig: { envConfig },
  } = useMobxStore();
  // router
  const router = useRouter();
  const { next: next_url } = router.query as { next: string };
  // states
  const [isLoading, setLoading] = useState(false);
  // toast
  const { setToastAlert } = useToast();

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
          else if (userSettings.workspace.invites > 0) router.push("/invitations");
          else router.push("/create-workspace");
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
        <div className={`bg-onboarding-gradient-primary h-full overflow-y-auto`}>
          <div className="sm:py-5 pl-8 pb-4 sm:pl-16 lg:pl-28 ">
            <div className="flex text-3xl items-center mt-16 font-semibold">
              <div className="h-[30px] w-[30px] mr-2">
                <Image src={BluePlaneLogoWithoutText} alt="Plane Logo" />
              </div>
              Plane
            </div>
          </div>

          <div className="md:w-2/3 sm:w-4/5 rounded-md mx-auto shadow-sm border border-custom-border-200">
            <div className={`p-4`}>
              <div className={`px-7 sm:px-0 bg-onboarding-gradient-secondary h-full pt-32 pb-20 rounded-md`}>
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
                        <div className="flex flex-col divide-y divide-custom-border-200">
                          <div className="pb-2">
                            <EmailCodeForm handleSignIn={handleEmailCodeSignIn} />
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
                      <div className="flex flex-col items-center justify-center gap-4 pt-7 sm:w-96 mx-auto overflow-hidden">
                        {envConfig?.google_client_id && (
                          <GoogleLoginButton clientId={envConfig?.google_client_id} handleSignIn={handleGoogleSignIn} />
                        )}
                        {envConfig?.github_client_id && (
                          <GithubLoginButton clientId={envConfig?.github_client_id} handleSignIn={handleGitHubSignIn} />
                        )}
                      </div>
                    </>
                    <div className={`flex py-2 bg-onboarding-background-100 mx-auto rounded-sm sm:w-96 mt-16`}>
                      <Lightbulb className="h-7 w-7 mr-2 mx-3" />
                      <p className={`text-sm text-left text-onboarding-text-200`}>
                        Try the latest features, like Tiptap editor, to write compelling responses.{" "}
                        <span className="font-medium underline hover:cursor-pointer" onClick={() => {}}>
                          See new features
                        </span>
                      </p>
                    </div>
                    <div className="flex justify-center sm:w-96 sm:h-64 object-cover mt-8 mx-auto rounded-md ">
                      <Image
                        src={signInIssues}
                        alt="Plane Logo"
                        className={`flex object-cover rounded-md bg-onboarding-background-100`}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
