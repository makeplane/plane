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
import {
  GoogleLoginButton,
  GithubLoginButton,
  EmailCodeForm,
  EmailPasswordForm,
} from "components/account";
// ui
import { Spinner } from "components/ui";
// icons
import Logo from "public/logo.png";
// types
import type { NextPage } from "next";

const SignInPage: NextPage = () => {
  // router
  const router = useRouter();
  // user hook
  const { mutateUser } = useUser({ redirectTo: "/", redirectIfFound: true });

  const { setToastAlert } = useToast();

  const handleGoogleSignIn = async ({ clientId, credential }: any) => {
    try {
      if (clientId && credential) {
        mutateUser(
          await authenticationService.socialAuth({
            medium: "google",
            credential,
            clientId,
          })
        );
      } else {
        throw Error("Cant find credentials");
      }
    } catch (error) {
      console.log(error);
      setToastAlert({
        title: "Error signing in!",
        type: "error",
        message: "Something went wrong. Please try again later or contact the support team.",
      });
    }
  };

  const handleGithubSignIn = async (credential: string) => {
    try {
      if (process.env.NEXT_PUBLIC_GITHUB_ID && credential) {
        mutateUser(
          await authenticationService.socialAuth({
            medium: "github",
            credential,
            clientId: process.env.NEXT_PUBLIC_GITHUB_ID,
          })
        );
      } else {
        throw Error("Cant find credentials");
      }
    } catch (error) {
      console.log(error);
      setToastAlert({
        title: "Error signing in!",
        type: "error",
        message: "Something went wrong. Please try again later or contact the support team.",
      });
    }
  };

  return (
    <DefaultLayout
      meta={{
        title: "Plane - Sign In",
      }}
    >
      {/* {isLoading && (
        <div className="absolute top-0 left-0 z-50 flex h-full w-full flex-col items-center justify-center gap-y-3 bg-white">
          <h2 className="text-xl text-gray-900">Signing in. Please wait...</h2>
          <Spinner />
        </div>
      )} */}
      <div className="flex h-screen w-full items-center justify-center overflow-auto bg-gray-50">
        <div className="flex min-h-full w-full flex-col justify-center py-12 px-6 lg:px-8">
          <div className="flex flex-col gap-10 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex flex-col items-center justify-center gap-10">
              <Image src={Logo} height={80} width={80} alt="Plane Web Logo" />
              <h2 className="text-center text-xl font-medium text-black">
                Sign In to your Plane Account
              </h2>
            </div>

            <div className="flex flex-col rounded-[10px] bg-white  shadow-md">
              {parseInt(process.env.NEXT_PUBLIC_ENABLE_OAUTH || "0") ? (
                <>
                  <EmailCodeForm />
                  <div className="flex flex-col gap-3 py-5 px-5 border-t items-center justify-center border-gray-300 ">
                    <GoogleLoginButton handleSignIn={handleGoogleSignIn} />
                    <GithubLoginButton handleSignIn={handleGithubSignIn} />
                  </div>
                </>
              ) : (
                <>
                  <EmailPasswordForm />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default SignInPage;
