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
  EmailSignInForm,
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
  const { mutateUser } = useUser();
  // states
  const [isLoading, setLoading] = useState(false);

  const { setToastAlert } = useToast();

  const onSignInSuccess = useCallback(async () => {
    setLoading(true);
    await mutateUser();
    const nextLocation = router.asPath.split("?next=")[1];
    if (nextLocation) await router.push(nextLocation as string);
    else await router.push("/");
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

  const handleGithubSignIn = useCallback(
    (credential: string) => {
      setLoading(true);
      authenticationService
        .socialAuth({
          medium: "github",
          credential,
          clientId: process.env.NEXT_PUBLIC_GITHUB_ID,
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
    },
    [onSignInSuccess, setToastAlert]
  );

  return (
    <DefaultLayout>
      {isLoading ? (
        <div className="absolute top-0 left-0 z-50 flex h-full w-full flex-col items-center justify-center gap-y-3">
          <h2 className="text-xl text-brand-base">Signing in. Please wait...</h2>
          <Spinner />
        </div>
      ) : (
        <div className="flex h-screen w-full items-center justify-center overflow-auto">
          <div className="flex min-h-full w-full flex-col justify-center py-12 px-6 lg:px-8">
            <div className="flex flex-col gap-10 sm:mx-auto sm:w-full sm:max-w-md">
              <div className="flex flex-col items-center justify-center gap-10">
                <Image src={Logo} height={80} width={80} alt="Plane Web Logo" />
                <h2 className="text-center text-xl font-medium text-brand-base">
                  Sign In to your Plane Account
                </h2>
              </div>

              <div className="flex flex-col rounded-[10px] bg-brand-base shadow-md">
                {parseInt(process.env.NEXT_PUBLIC_ENABLE_OAUTH || "0") ? (
                  <>
                    <EmailSignInForm handleSuccess={onSignInSuccess} />

                    <div className="flex flex-col items-center justify-center gap-3 border-t border-brand-base py-5 px-5 ">
                      <GoogleLoginButton handleSignIn={handleGoogleSignIn} />

                      <GithubLoginButton handleSignIn={handleGithubSignIn} />
                    </div>
                  </>
                ) : (
                  <>
                    <EmailPasswordForm onSuccess={onSignInSuccess} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DefaultLayout>
  );
};

export default SignInPage;
