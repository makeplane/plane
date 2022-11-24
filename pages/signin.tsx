import React, { useCallback, useState, useEffect } from "react";
// next
import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
// hooks
import useUser from "lib/hooks/useUser";
// services
import authenticationService from "lib/services/authentication.service";
// hoc
import withAuthWrapper from "lib/hoc/withAuthWrapper";
// layouts
import DefaultLayout from "layouts/DefaultLayout";
// social button
import { GoogleLoginButton } from "components/socialbuttons/google-login";
import EmailCodeForm from "components/forms/EmailCodeForm";
import EmailPasswordForm from "components/forms/EmailPasswordForm";
// logos
import Logo from "public/logo.png";
import GitHubLogo from "public/logos/github.png";
import { KeyIcon } from "@heroicons/react/24/outline";

// types
type SignIn = {
  email: string;
  password?: string;
  medium?: string;
  key?: string;
  token?: string;
};

const SignIn: NextPage = () => {
  const [useCode, setUseCode] = useState(true);
  const router = useRouter();

  const { mutateUser, mutateWorkspaces } = useUser();

  const [githubToken, setGithubToken] = useState(undefined);
  const [loginCallBackURL, setLoginCallBackURL] = useState(undefined);

  const [isGoogleAuthenticationLoading, setIsGoogleAuthenticationLoading] = useState(false);

  const onSignInSuccess = useCallback(
    async (res: any) => {
      await mutateUser();
      await mutateWorkspaces();
      if (res.user.is_onboarded) router.push("/");
      else router.push("/invitations");
    },
    [mutateUser, mutateWorkspaces, router]
  );

  const githubTokenMemo = React.useMemo(() => {
    return githubToken;
  }, [githubToken]);

  useEffect(() => {
    const {
      query: { code },
    } = router;
    if (code && !githubTokenMemo) {
      setGithubToken(code as any);
    }
  }, [router, githubTokenMemo]);

  useEffect(() => {
    if (githubToken) {
      authenticationService
        .socialAuth({
          medium: "github",
          credential: githubToken,
          clientId: process.env.NEXT_PUBLIC_GITHUB_ID,
        })
        .then(async (response) => {
          await onSignInSuccess(response);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [githubToken, mutateUser, mutateWorkspaces, router, onSignInSuccess]);

  useEffect(() => {
    const origin =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    setLoginCallBackURL(`${origin}/signin` as any);

    return () => setIsGoogleAuthenticationLoading(false);
  }, []);

  return (
    <DefaultLayout
      meta={{
        title: "Plane - Sign In",
      }}
    >
      {isGoogleAuthenticationLoading && (
        <div className="absolute top-0 left-0 w-full h-full bg-white z-50 flex items-center justify-center">
          <h2 className="text-2xl text-black">Sign in with Google. Please wait...</h2>
        </div>
      )}
      <div className="w-full h-screen flex justify-center items-center bg-gray-50 overflow-auto">
        <div className="min-h-full w-full flex flex-col justify-center py-12 px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
              <Image src={Logo} height={40} width={179} alt="Plane Web Logo" />
            </div>
            <h2 className="mt-3 text-center text-3xl font-bold text-gray-900">
              Sign in to your account
            </h2>
            <div className="bg-white mt-16 py-8 px-4 sm:rounded-lg sm:px-10">
              {useCode ? (
                <EmailCodeForm onSuccess={onSignInSuccess} />
              ) : (
                <EmailPasswordForm onSuccess={onSignInSuccess} />
              )}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>
                <div className="mt-6 w-full flex flex-col items-stretch gap-y-2">
                  <button
                    type="button"
                    className="w-full border border-gray-300 hover:bg-gray-100 px-3 py-2 rounded text-sm flex items-center duration-300"
                    onClick={() => setUseCode((prev) => !prev)}
                  >
                    <KeyIcon className="h-[25px] w-[25px]" />
                    <span className="text-center w-full font-medium">
                      {useCode ? "Continue with Password" : "Continue with Code"}
                    </span>
                  </button>
                  <GoogleLoginButton
                    onSuccess={({ clientId, credential }) => {
                      setIsGoogleAuthenticationLoading(true);
                      authenticationService
                        .socialAuth({
                          medium: "google",
                          credential,
                          clientId,
                        })
                        .then(async (response) => {
                          await onSignInSuccess(response);
                        })
                        .catch((err) => {
                          console.log(err);
                          setIsGoogleAuthenticationLoading(false);
                        });
                    }}
                    onFailure={(err) => {
                      console.log(err);
                    }}
                  />
                  <Link
                    href={`https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_ID}&redirect_uri=${loginCallBackURL}`}
                  >
                    <button className="w-full bg-black opacity-90 hover:opacity-100 text-white text-sm flex items-center px-3 py-2 rounded duration-300">
                      <Image
                        src={GitHubLogo}
                        height={25}
                        width={25}
                        className="flex-shrink-0"
                        alt="GitHub Logo"
                      />
                      <span className="text-center w-full font-medium">Continue with GitHub</span>
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default withAuthWrapper(SignIn);
