import React, { useState } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import Link from "next/link";
import { useRouter } from "next/router";
// types
import { IEmailCheckData } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { OAuthOptions, SignUpEmailForm, SignUpPasswordForm, TermsAndConditions } from "@/components/account";
import { UniqueCodeForm } from "@/components/account/common";
// hooks
import { useInstance } from "@/hooks/store";
import useSignInRedirection from "@/hooks/use-sign-in-redirection";
// services
import { AuthService } from "@/services/auth.service";

const authService = new AuthService();

export enum ESignUpSteps {
  EMAIL = "EMAIL",
  UNIQUE_CODE = "UNIQUE_CODE",
  PASSWORD = "PASSWORD",
  OPTIONAL_SET_PASSWORD = "OPTIONAL_SET_PASSWORD",
}

export const SignUpRoot = observer(() => {
  // router
  const router = useRouter();
  const { email: emailParam } = router.query;
  // states
  const [signInStep, setSignInStep] = useState<ESignUpSteps | null>(ESignUpSteps.EMAIL);
  const [email, setEmail] = useState(emailParam ? emailParam.toString() : "");
  // sign in redirection hook
  const { handleRedirection } = useSignInRedirection();
  // mobx store
  const { instance } = useInstance();

  const redirectToSignIn = (email: string) => {
    if (isEmpty(email)) router.push("/");
    else router.push({ pathname: "/", query: { ...router.query, email: email } });
  };

  // step 1 submit handler- email verification
  const handleEmailVerification = async (data: IEmailCheckData) => {
    setEmail(data.email);

    await authService
      .signUpEmailCheck(data)
      .then(() => {
        if (instance?.config?.is_smtp_configured) setSignInStep(ESignUpSteps.UNIQUE_CODE);
        else setSignInStep(ESignUpSteps.PASSWORD);
      })
      .catch((err) => {
        if (err?.error_code === "USER_ALREADY_EXIST") {
          redirectToSignIn(data.email);
          return;
        }
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        });
      });
  };

  // step 3 submit handler- password sign in
  const handlePasswordSignIn = async () => {
    await handleRedirection();
  };

  const isOAuthEnabled =
    instance?.config && (instance?.config?.is_google_enabled || instance?.config?.is_github_enabled);

  return (
    <>
      <div className="mx-auto flex flex-col">
        <>
          <div className="text-center space-y-1 py-4 mx-auto sm:w-96">
            <h3 className="text-3xl font-bold text-onboarding-text-100">Create your account</h3>
            <p className="font-medium text-onboarding-text-400">Start tracking your projects with Plane</p>
          </div>
          {signInStep === ESignUpSteps.EMAIL && (
            <SignUpEmailForm defaultEmail={email} onSubmit={handleEmailVerification} />
          )}
          {signInStep === ESignUpSteps.UNIQUE_CODE && (
            <UniqueCodeForm
              email={email}
              handleEmailClear={() => {
                setEmail("");
                setSignInStep(ESignUpSteps.EMAIL);
              }}
              submitButtonText="Create account"
            />
          )}
          {signInStep === ESignUpSteps.PASSWORD && (
            <SignUpPasswordForm
              email={email}
              handleEmailClear={() => {
                setEmail("");
                setSignInStep(ESignUpSteps.EMAIL);
              }}
              onSubmit={handlePasswordSignIn}
            />
          )}
        </>
      </div>
      {signInStep && (
        <>
          {isOAuthEnabled && <OAuthOptions />}
          <div className="mx-auto mt-8 text-center text-base text-onboarding-text-300 sm:w-96">
            By creating an account, you agree to our <br />
            <Link
              href="https://plane.so/legals/terms-and-conditions"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="https://plane.so/legals/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline"
            >
              Privacy Policy
            </Link>
          </div>
          <TermsAndConditions isSignUp />
        </>
      )}
    </>
  );
});
