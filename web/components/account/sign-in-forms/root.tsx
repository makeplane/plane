import React, { useEffect, useState } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
// hooks
import { useApplication } from "hooks/store";
import useSignInRedirection from "hooks/use-sign-in-redirection";
// components
import { LatestFeatureBlock } from "components/common";
import {
  SignInEmailForm,
  SignInUniqueCodeForm,
  SignInPasswordForm,
  OAuthOptions,
  SignInOptionalSetPasswordForm,
} from "components/account";

export enum ESignInSteps {
  EMAIL = "EMAIL",
  PASSWORD = "PASSWORD",
  UNIQUE_CODE = "UNIQUE_CODE",
  OPTIONAL_SET_PASSWORD = "OPTIONAL_SET_PASSWORD",
  USE_UNIQUE_CODE_FROM_PASSWORD = "USE_UNIQUE_CODE_FROM_PASSWORD",
}

export const SignInRoot = observer(() => {
  // states
  const [signInStep, setSignInStep] = useState<ESignInSteps | null>(null);
  const [email, setEmail] = useState("");
  // sign in redirection hook
  const { handleRedirection } = useSignInRedirection();
  // mobx store
  const {
    config: { envConfig },
  } = useApplication();
  // derived values
  const isSmtpConfigured = envConfig?.is_smtp_configured;

  // step 1 submit handler- email verification
  const handleEmailVerification = (isPasswordAutoset: boolean) => {
    if (isSmtpConfigured && isPasswordAutoset) setSignInStep(ESignInSteps.UNIQUE_CODE);
    else setSignInStep(ESignInSteps.PASSWORD);
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

  const isOAuthEnabled = envConfig && (envConfig.google_client_id || envConfig.github_client_id);

  useEffect(() => {
    if (isSmtpConfigured) setSignInStep(ESignInSteps.EMAIL);
    else setSignInStep(ESignInSteps.PASSWORD);
  }, [isSmtpConfigured]);

  return (
    <>
      <div className="mx-auto flex flex-col">
        <>
          {signInStep === ESignInSteps.EMAIL && (
            <SignInEmailForm onSubmit={handleEmailVerification} updateEmail={(newEmail) => setEmail(newEmail)} />
          )}
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
      {isOAuthEnabled &&
        (signInStep === ESignInSteps.EMAIL || (!isSmtpConfigured && signInStep === ESignInSteps.PASSWORD)) && (
          <>
            <OAuthOptions handleSignInRedirection={handleRedirection} type="sign_in" />
            <p className="text-xs text-onboarding-text-300 text-center mt-6">
              Don{"'"}t have an account?{" "}
              <Link href="/accounts/sign-up" className="text-custom-primary-100 font-medium underline">
                Sign up
              </Link>
            </p>
          </>
        )}
      <LatestFeatureBlock />
    </>
  );
});
