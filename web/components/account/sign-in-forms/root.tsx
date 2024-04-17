import React, { useState } from "react";
import { observer } from "mobx-react";
// types
import { IEmailCheckData } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import {
  SignInEmailForm,
  SignInUniqueCodeForm,
  SignInPasswordForm,
  OAuthOptions,
  SignInOptionalSetPasswordForm,
} from "@/components/account";
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
  USE_UNIQUE_CODE_FROM_PASSWORD = "USE_UNIQUE_CODE_FROM_PASSWORD",
}

export const SignInRoot = observer(() => {
  // states
  const [signInStep, setSignInStep] = useState<ESignInSteps | null>(ESignInSteps.EMAIL);
  const [email, setEmail] = useState("");
  // sign in redirection hook
  const { handleRedirection } = useSignInRedirection();
  // hooks
  const { instance } = useInstance();
  // derived values
  const isSmtpConfigured = instance?.config?.is_smtp_configured;

  // step 1 submit handler- email verification
  const handleEmailVerification = async (data: IEmailCheckData) => {
    setEmail(data.email);

    await authService
      .emailCheck(data)
      .then((res) => {
        if (isSmtpConfigured && res.is_password_autoset) setSignInStep(ESignInSteps.UNIQUE_CODE);
        else setSignInStep(ESignInSteps.PASSWORD);
      })
      .catch((err) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        })
      );
  };

  // step 2 submit handler- unique code sign in
  const handleUniqueCodeSignIn = async (isPasswordAutoset: boolean) => {
    if (isPasswordAutoset) setSignInStep(ESignInSteps.OPTIONAL_SET_PASSWORD);
    else await handleRedirection();
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
          {signInStep === ESignInSteps.EMAIL && <SignInEmailForm onSubmit={handleEmailVerification} />}
          {signInStep === ESignInSteps.UNIQUE_CODE && (
            <SignInUniqueCodeForm
              email={email}
              handleEmailClear={() => {
                setEmail("");
                setSignInStep(ESignInSteps.EMAIL);
              }}
              onSubmit={handleUniqueCodeSignIn}
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
          {signInStep === ESignInSteps.USE_UNIQUE_CODE_FROM_PASSWORD && (
            <SignInUniqueCodeForm
              email={email}
              handleEmailClear={() => {
                setEmail("");
                setSignInStep(ESignInSteps.EMAIL);
              }}
              onSubmit={handleUniqueCodeSignIn}
              submitButtonText="Go to workspace"
            />
          )}
          {signInStep === ESignInSteps.OPTIONAL_SET_PASSWORD && (
            <SignInOptionalSetPasswordForm email={email} handleSignInRedirection={handleRedirection} />
          )}
        </>
      </div>

      {isOAuthEnabled && signInStep !== ESignInSteps.OPTIONAL_SET_PASSWORD && <OAuthOptions />}
    </>
  );
});
