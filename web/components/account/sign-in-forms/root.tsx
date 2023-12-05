import React, { useState } from "react";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useSignInRedirection from "hooks/use-sign-in-redirection";
// components
import {
  EmailForm,
  UniqueCodeForm,
  PasswordForm,
  SetPasswordLink,
  OAuthOptions,
  OptionalSetPasswordForm,
  CreatePasswordForm,
  LatestFeatures,
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
  // sign in redirection hook
  const { handleRedirection } = useSignInRedirection();
  // mobx store
  const {
    appConfig: { envConfig },
  } = useMobxStore();

  return (
    <>
      <div className="mx-auto flex flex-col">
        {signInStep === ESignInSteps.EMAIL && (
          <EmailForm handleStepChange={(step) => setSignInStep(step)} updateEmail={(newEmail) => setEmail(newEmail)} />
        )}
        {signInStep === ESignInSteps.PASSWORD && (
          <PasswordForm
            email={email}
            updateEmail={(newEmail) => setEmail(newEmail)}
            handleStepChange={(step) => setSignInStep(step)}
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
            submitButtonLabel={{
              loading: "Signing in...",
              default: "Go to workspace",
            }}
          />
        )}
        {signInStep === ESignInSteps.UNIQUE_CODE && (
          <UniqueCodeForm
            email={email}
            updateEmail={(newEmail) => setEmail(newEmail)}
            handleStepChange={(step) => setSignInStep(step)}
            handleSignInRedirection={handleRedirection}
          />
        )}
        {signInStep === ESignInSteps.OPTIONAL_SET_PASSWORD && (
          <OptionalSetPasswordForm
            email={email}
            handleStepChange={(step) => setSignInStep(step)}
            handleSignInRedirection={handleRedirection}
          />
        )}
        {signInStep === ESignInSteps.CREATE_PASSWORD && (
          <CreatePasswordForm
            email={email}
            handleStepChange={(step) => setSignInStep(step)}
            handleSignInRedirection={handleRedirection}
          />
        )}
      </div>
      {!OAUTH_HIDDEN_STEPS.includes(signInStep) && (
        <OAuthOptions
          updateEmail={(newEmail) => setEmail(newEmail)}
          handleStepChange={(step) => setSignInStep(step)}
          handleSignInRedirection={handleRedirection}
        />
      )}
      <LatestFeatures />
    </>
  );
});
