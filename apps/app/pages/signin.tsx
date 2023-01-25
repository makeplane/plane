import React, { useCallback, useState } from "react";

import { useRouter } from "next/router";
import Image from "next/image";

// hooks
import useUser from "hooks/use-user";
import useToast from "hooks/use-toast";
// services
import authenticationService from "services/authentication.service";
// layouts
import DefaultLayout from "layouts/default-layout";
// social button
import { GoogleLoginButton, GithubLoginButton, EmailSignInForm } from "components/account";
// ui
import { Spinner } from "components/ui";
// icons
import Logo from "public/logo-with-text.png";
// types
import type { NextPage } from "next";

const { NEXT_PUBLIC_GITHUB_ID } = process.env;

const SignInPage: NextPage = () => {
  // router
  const router = useRouter();
  // user hook
  const { mutateUser } = useUser();
  // states
  const [isLoading, setLoading] = useState(false);

  const { setToastAlert } = useToast();

  const onSignInSuccess = useCallback(async () => {
    await mutateUser();
    const nextLocation = router.asPath.split("?next=")[1];
    if (nextLocation) router.push(nextLocation as string);
    else router.push("/");
  }, [mutateUser, router]);

  const handleGoogleSignIn = ({ clientId, credential }: any) => {
    if (clientId && credential) {
      setLoading(true);
      authenticationService
        .socialAuth({
          medium: "google",
          credential,
          clientId,
        })
        .then(async () => {
          await onSignInSuccess();
        })
        .catch((err) => {
          console.log(err);
          setToastAlert({
            title: "Error signing in!",
            type: "error",
            message: "Something went wrong. Please try again later or contact the support team.",
          });
          setLoading(false);
        });
    }
  };

  const handleGithubSignIn = (githubToken: string) => {
    setLoading(true);
    authenticationService
      .socialAuth({
        medium: "github",
        credential: githubToken,
        clientId: NEXT_PUBLIC_GITHUB_ID,
      })
      .then(async () => {
        await onSignInSuccess();
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };

  return (
    <DefaultLayout
      meta={{
        title: "Plane - Sign In",
      }}
    >
      {isLoading && (
        <div className="absolute top-0 left-0 z-50 flex h-full w-full flex-col items-center justify-center gap-y-3 bg-white">
          <h2 className="text-2xl text-gray-900">Signing in. Please wait...</h2>
          <Spinner />
        </div>
      )}
      <div className="flex h-screen w-full items-center justify-center overflow-auto bg-gray-50">
        <div className="flex min-h-full w-full flex-col justify-center py-12 px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
              <Image src={Logo} height={40} width={179} alt="Plane Web Logo" />
            </div>
            <h2 className="mt-3 text-center text-3xl font-bold text-gray-900">
              Sign in to your account
            </h2>
            <div className="mt-16 bg-white py-8 px-4 sm:rounded-lg sm:px-10">
              <div className="mb-4">
                <EmailSignInForm handleSuccess={onSignInSuccess} />
              </div>
              <div className="mb-4">
                <GoogleLoginButton handleSignIn={handleGoogleSignIn} />
              </div>
              <div className="mb-4">
                <GithubLoginButton handleSignIn={handleGithubSignIn} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default SignInPage;
