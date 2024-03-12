import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// hooks
import { useEventTracker } from "hooks/store";
import useSignInRedirection from "hooks/use-sign-in-redirection";
import { useStore } from "hooks";
// components
import {
  OAuthOptions,
  SignUpEmailForm,
  SignUpOptionalSetPasswordForm,
  SignUpPasswordForm,
  SignUpUniqueCodeForm,
} from "components/account";
// constants
import { NAVIGATE_TO_SIGNIN } from "constants/event-tracker";

export enum ESignUpSteps {
  EMAIL = "EMAIL",
  UNIQUE_CODE = "UNIQUE_CODE",
  PASSWORD = "PASSWORD",
  OPTIONAL_SET_PASSWORD = "OPTIONAL_SET_PASSWORD",
}

const OAUTH_ENABLED_STEPS = [ESignUpSteps.EMAIL];

export const SignUpRoot = observer(() => {
  // states
  const [signInStep, setSignInStep] = useState<ESignUpSteps | null>(null);
  const [email, setEmail] = useState("");
  // sign in redirection hook
  const { handleRedirection } = useSignInRedirection();
  // mobx store
  const {
    instance: { instance },
  } = useStore();
  const { captureEvent } = useEventTracker();

  // step 1 submit handler- email verification
  const handleEmailVerification = () => setSignInStep(ESignUpSteps.UNIQUE_CODE);

  // step 2 submit handler- unique code sign in
  const handleUniqueCodeSignIn = async (isPasswordAutoset: boolean) => {
    if (isPasswordAutoset) setSignInStep(ESignUpSteps.OPTIONAL_SET_PASSWORD);
    else await handleRedirection();
  };

  // step 3 submit handler- password sign in
  const handlePasswordSignIn = async () => {
    await handleRedirection();
  };

  const isOAuthEnabled =
    instance?.config && (instance?.config?.is_google_enabled || instance?.config?.is_github_enabled);

  useEffect(() => {
    if (instance?.config?.is_smtp_configured) setSignInStep(ESignUpSteps.EMAIL);
    else setSignInStep(ESignUpSteps.PASSWORD);
  }, [instance?.config?.is_smtp_configured]);

  return (
    <>
      <div className="mx-auto flex flex-col">
        <>
          {signInStep === ESignUpSteps.EMAIL && (
            <SignUpEmailForm onSubmit={handleEmailVerification} updateEmail={(newEmail) => setEmail(newEmail)} />
          )}
          {signInStep === ESignUpSteps.UNIQUE_CODE && (
            <SignUpUniqueCodeForm
              email={email}
              handleEmailClear={() => {
                setEmail("");
                setSignInStep(ESignUpSteps.EMAIL);
              }}
              onSubmit={handleUniqueCodeSignIn}
            />
          )}
          {signInStep === ESignUpSteps.PASSWORD && <SignUpPasswordForm onSubmit={handlePasswordSignIn} />}
          {signInStep === ESignUpSteps.OPTIONAL_SET_PASSWORD && (
            <SignUpOptionalSetPasswordForm
              email={email}
              handleSignInRedirection={handleRedirection}
              handleStepChange={(step) => setSignInStep(step)}
            />
          )}
        </>
      </div>
      {isOAuthEnabled && signInStep && OAUTH_ENABLED_STEPS.includes(signInStep) && (
        <>
          <OAuthOptions />
          <p className="text-xs text-onboarding-text-300 text-center mt-6">
            Already using Plane?{" "}
            <Link
              href="/"
              onClick={() => captureEvent(NAVIGATE_TO_SIGNIN, {})}
              className="text-custom-primary-100 font-medium underline"
            >
              Sign in
            </Link>
          </p>
        </>
      )}
    </>
  );
});
