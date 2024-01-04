import React, { useState } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useApplication } from "hooks/store";
import useSignInRedirection from "hooks/use-sign-in-redirection";
// components
import { LatestFeatureBlock } from "components/common";
import {
  EmailForm,
  UniqueCodeForm,
  PasswordForm,
  SetPasswordLink,
  OAuthOptions,
  OptionalSetPasswordForm,
  CreatePasswordForm,
} from "components/account";

export enum ESignInSteps {
  EMAIL = "EMAIL",
  PASSWORD = "PASSWORD",
  SET_PASSWORD_LINK = "SET_PASSWORD_LINK",
  UNIQUE_CODE = "UNIQUE_CODE",
  OPTIONAL_SET_PASSWORD = "OPTIONAL_SET_PASSWORD",
  CREATE_PASSWORD = "CREATE_PASSWORD",
  USE_UNIQUE_CODE_FROM_PASSWORD = "USE_UNIQUE_CODE_FROM_PASSWORD",
}

const OAUTH_HIDDEN_STEPS = [ESignInSteps.OPTIONAL_SET_PASSWORD, ESignInSteps.CREATE_PASSWORD];

export const SignInRoot = observer(() => {
  // states
  const [signInStep, setSignInStep] = useState<ESignInSteps>(ESignInSteps.EMAIL);
  const [email, setEmail] = useState("");
  const [isOnboarded, setIsOnboarded] = useState(false);
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
            <EmailForm
              handleStepChange={(step) => setSignInStep(step)}
              updateEmail={(newEmail) => setEmail(newEmail)}
            />
          )}
          {signInStep === ESignInSteps.PASSWORD && (
            <PasswordForm
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
          {signInStep === ESignInSteps.SET_PASSWORD_LINK && (
            <SetPasswordLink email={email} updateEmail={(newEmail) => setEmail(newEmail)} />
          )}
          {signInStep === ESignInSteps.USE_UNIQUE_CODE_FROM_PASSWORD && (
            <UniqueCodeForm
              email={email}
              updateEmail={(newEmail) => setEmail(newEmail)}
              handleStepChange={(step) => setSignInStep(step)}
              handleSignInRedirection={handleRedirection}
              submitButtonLabel="Go to workspace"
              showTermsAndConditions
              updateUserOnboardingStatus={(value) => setIsOnboarded(value)}
              handleEmailClear={() => {
                setEmail("");
                setSignInStep(ESignInSteps.EMAIL);
              }}
            />
          )}
          {signInStep === ESignInSteps.UNIQUE_CODE && (
            <UniqueCodeForm
              email={email}
              updateEmail={(newEmail) => setEmail(newEmail)}
              handleStepChange={(step) => setSignInStep(step)}
              handleSignInRedirection={handleRedirection}
              updateUserOnboardingStatus={(value) => setIsOnboarded(value)}
              handleEmailClear={() => {
                setEmail("");
                setSignInStep(ESignInSteps.EMAIL);
              }}
            />
          )}
          {signInStep === ESignInSteps.OPTIONAL_SET_PASSWORD && (
            <OptionalSetPasswordForm
              email={email}
              handleStepChange={(step) => setSignInStep(step)}
              handleSignInRedirection={handleRedirection}
              isOnboarded={isOnboarded}
            />
          )}
          {signInStep === ESignInSteps.CREATE_PASSWORD && (
            <CreatePasswordForm
              email={email}
              handleStepChange={(step) => setSignInStep(step)}
              handleSignInRedirection={handleRedirection}
              isOnboarded={isOnboarded}
            />
          )}
        </>
      </div>
      {isOAuthEnabled && !OAUTH_HIDDEN_STEPS.includes(signInStep) && (
        <OAuthOptions handleSignInRedirection={handleRedirection} />
      )}
      <LatestFeatureBlock />
    </>
  );
});
