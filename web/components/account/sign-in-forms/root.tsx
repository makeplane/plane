import React, { useState } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// types
import { IEmailCheckData } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { SignInEmailForm, SignInPasswordForm, OAuthOptions, TermsAndConditions } from "@/components/account";
import { UniqueCodeForm } from "@/components/account/common";
// hooks
import { useInstance } from "@/hooks/store";
import useSignInRedirection from "@/hooks/use-sign-in-redirection";
// services
import { AuthService } from "@/services/auth.service";

const authService = new AuthService();

export enum ESignInSteps {
  EMAIL = "EMAIL",
  PASSWORD = "PASSWORD",
  UNIQUE_CODE = "UNIQUE_CODE",
  OPTIONAL_SET_PASSWORD = "OPTIONAL_SET_PASSWORD",
}

export const SignInRoot = observer(() => {
  //router
  const router = useRouter();
  const { email: emailParam } = router.query;
  // states
  const [signInStep, setSignInStep] = useState<ESignInSteps | null>(ESignInSteps.EMAIL);
  const [email, setEmail] = useState(emailParam ? emailParam.toString() : "");
  // sign in redirection hook
  const { handleRedirection } = useSignInRedirection();
  // hooks
  const { instance } = useInstance();
  // derived values
  const isSmtpConfigured = instance?.config?.is_smtp_configured;

  const redirectToSignUp = (email: string) => {
    if (isEmpty(email)) router.push("/accounts/sign-up");
    else router.push({ pathname: "/accounts/sign-up", query: { ...router.query, email: email } });
  };

  // step 1 submit handler- email verification
  const handleEmailVerification = async (data: IEmailCheckData) => {
    setEmail(data.email);

    await authService
      .signInEmailCheck(data)
      .then((res) => {
        if (res.is_password_autoset) {
          if (!isSmtpConfigured) {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: "Unable to process request please contact Administrator to reset password",
            });
          } else {
            setSignInStep(ESignInSteps.UNIQUE_CODE);
          }
        } else setSignInStep(ESignInSteps.PASSWORD);
      })
      .catch((err) => {
        if (err?.error_code === "USER_DOES_NOT_EXIST") {
          redirectToSignUp(data.email);
          return;
        }
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.error_message ?? "Something went wrong. Please try again.",
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
        <div className="text-center space-y-1 py-4 mx-auto sm:w-96">
          <h3 className="text-3xl font-bold text-onboarding-text-100">Sign in to Plane</h3>
          <p className="font-medium text-onboarding-text-400">Get back to your projects and make progress</p>
        </div>
        {signInStep === ESignInSteps.EMAIL && (
          <SignInEmailForm defaultEmail={email} onSubmit={handleEmailVerification} />
        )}
        {signInStep === ESignInSteps.UNIQUE_CODE && (
          <UniqueCodeForm
            email={email}
            handleEmailClear={() => {
              setEmail("");
              setSignInStep(ESignInSteps.EMAIL);
            }}
            submitButtonText="Continue"
          />
        )}
        {signInStep === ESignInSteps.PASSWORD && (
          <SignInPasswordForm
            email={email}
            handleEmailClear={() => {
              setEmail("");
              setSignInStep(ESignInSteps.EMAIL);
            }}
            onSubmit={handlePasswordSignIn}
            handleStepChange={(step) => setSignInStep(step)}
          />
        )}
      </div>
      {isOAuthEnabled && signInStep !== ESignInSteps.OPTIONAL_SET_PASSWORD && <OAuthOptions />}

      <TermsAndConditions />
    </>
  );
});
