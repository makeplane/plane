import React, { useState } from "react";
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
  const [signInStep, setSignInStep] = useState<ESignInSteps>(ESignInSteps.EMAIL);
  const [email, setEmail] = useState("");
  // sign in redirection hook
  const { handleRedirection } = useSignInRedirection();
  // mobx store
  const {
    config: { envConfig },
  } = useApplication();

  const isOAuthEnabled = envConfig && (envConfig.google_client_id || envConfig.github_client_id);

  return (
    <>
      <div className="mx-auto flex flex-col">
        <>
          {signInStep === ESignInSteps.EMAIL && (
            <SignInEmailForm
              handleStepChange={(step) => setSignInStep(step)}
              updateEmail={(newEmail) => setEmail(newEmail)}
            />
          )}
          {signInStep === ESignInSteps.UNIQUE_CODE && (
            <SignInUniqueCodeForm
              email={email}
              handleStepChange={(step) => setSignInStep(step)}
              handleSignInRedirection={handleRedirection}
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
              updateEmail={(newEmail) => setEmail(newEmail)}
              handleStepChange={(step) => setSignInStep(step)}
              handleEmailClear={() => {
                setEmail("");
                setSignInStep(ESignInSteps.EMAIL);
              }}
              handleSignInRedirection={handleRedirection}
            />
          )}
          {signInStep === ESignInSteps.USE_UNIQUE_CODE_FROM_PASSWORD && (
            <SignInUniqueCodeForm
              email={email}
              handleStepChange={(step) => setSignInStep(step)}
              handleSignInRedirection={handleRedirection}
              handleEmailClear={() => {
                setEmail("");
                setSignInStep(ESignInSteps.EMAIL);
              }}
              submitButtonText="Go to workspace"
            />
          )}
          {signInStep === ESignInSteps.OPTIONAL_SET_PASSWORD && (
            <SignInOptionalSetPasswordForm
              email={email}
              handleStepChange={(step) => setSignInStep(step)}
              handleSignInRedirection={handleRedirection}
            />
          )}
        </>
      </div>
      {isOAuthEnabled && signInStep === ESignInSteps.EMAIL && (
        <>
          <OAuthOptions handleSignInRedirection={handleRedirection} />
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
