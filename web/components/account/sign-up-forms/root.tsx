import React, { useState } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useApplication } from "hooks/store";
import useSignInRedirection from "hooks/use-sign-in-redirection";
// components
import {
  OAuthOptions,
  SignUpEmailForm,
  SignUpOptionalSetPasswordForm,
  SignUpPasswordForm,
  SignUpUniqueCodeForm,
} from "components/account";
import Link from "next/link";

export enum ESignUpSteps {
  EMAIL = "EMAIL",
  UNIQUE_CODE = "UNIQUE_CODE",
  PASSWORD = "PASSWORD",
  OPTIONAL_SET_PASSWORD = "OPTIONAL_SET_PASSWORD",
}

export const SignUpRoot = observer(() => {
  // states
  const [signInStep, setSignInStep] = useState<ESignUpSteps>(ESignUpSteps.EMAIL);
  const [email, setEmail] = useState("");
  // sign in redirection hook
  const { handleRedirection } = useSignInRedirection();
  // mobx store
  const {
    config: { envConfig },
  } = useApplication();

  // step 1 submit handler- email verification
  const handleEmailVerification = () => {
    if (envConfig?.is_smtp_configured) setSignInStep(ESignUpSteps.UNIQUE_CODE);
    else setSignInStep(ESignUpSteps.PASSWORD);
  };

  // step 2 submit handler- unique code sign in
  const handleUniqueCodeSignIn = async (isPasswordAutoset: boolean) => {
    if (isPasswordAutoset) setSignInStep(ESignUpSteps.OPTIONAL_SET_PASSWORD);
    else await handleRedirection();
  };

  // step 3 submit handler- password sign in
  const handlePasswordSignIn = async () => {
    await handleRedirection();
  };

  const isOAuthEnabled = envConfig && (envConfig.google_client_id || envConfig.github_client_id);

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
          {signInStep === ESignUpSteps.OPTIONAL_SET_PASSWORD && (
            <SignUpOptionalSetPasswordForm
              email={email}
              handleSignInRedirection={handleRedirection}
              handleStepChange={(step) => setSignInStep(step)}
            />
          )}
        </>
      </div>
      {isOAuthEnabled && signInStep === ESignUpSteps.EMAIL && (
        <>
          <OAuthOptions handleSignInRedirection={handleRedirection} />
          <p className="text-xs text-onboarding-text-300 text-center mt-6">
            Already using Plane?{" "}
            <Link href="/" className="text-custom-primary-100 font-medium underline">
              Sign in
            </Link>
          </p>
        </>
      )}
    </>
  );
});
