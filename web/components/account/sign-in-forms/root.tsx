import React, { useState } from "react";
// components
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
}

type Props = {
  handleSignInRedirection: () => Promise<void>;
};

const OAUTH_HIDDEN_STEPS = [ESignInSteps.OPTIONAL_SET_PASSWORD, ESignInSteps.CREATE_PASSWORD];

export const SignInRoot: React.FC<Props> = (props) => {
  const { handleSignInRedirection } = props;
  // states
  const [signInStep, setSignInStep] = useState<ESignInSteps>(ESignInSteps.EMAIL);
  const [email, setEmail] = useState("");

  return (
    <>
      <div className="mx-auto flex flex-col">
        {signInStep === ESignInSteps.EMAIL && (
          <EmailForm
            handleStepChange={(step: ESignInSteps) => setSignInStep(step)}
            updateEmail={(newEmail) => setEmail(newEmail)}
          />
        )}
        {signInStep === ESignInSteps.PASSWORD && (
          <PasswordForm
            email={email}
            updateEmail={(newEmail) => setEmail(newEmail)}
            handleStepChange={(step: ESignInSteps) => setSignInStep(step)}
            handleSignInRedirection={handleSignInRedirection}
          />
        )}
        {signInStep === ESignInSteps.SET_PASSWORD_LINK && (
          <SetPasswordLink email={email} updateEmail={(newEmail) => setEmail(newEmail)} />
        )}
        {signInStep === ESignInSteps.UNIQUE_CODE && (
          <UniqueCodeForm
            email={email}
            updateEmail={(newEmail) => setEmail(newEmail)}
            handleStepChange={(step: ESignInSteps) => setSignInStep(step)}
            handleSignInRedirection={handleSignInRedirection}
          />
        )}
        {signInStep === ESignInSteps.OPTIONAL_SET_PASSWORD && (
          <OptionalSetPasswordForm
            email={email}
            handleStepChange={(step: ESignInSteps) => setSignInStep(step)}
            handleSignInRedirection={handleSignInRedirection}
          />
        )}
        {signInStep === ESignInSteps.CREATE_PASSWORD && (
          <CreatePasswordForm
            email={email}
            handleStepChange={(step: ESignInSteps) => setSignInStep(step)}
            handleSignInRedirection={handleSignInRedirection}
          />
        )}
      </div>
      {!OAUTH_HIDDEN_STEPS.includes(signInStep) && (
        <OAuthOptions
          updateEmail={(newEmail) => setEmail(newEmail)}
          handleStepChange={(step: ESignInSteps) => setSignInStep(step)}
          handleSignInRedirection={handleSignInRedirection}
        />
      )}
    </>
  );
};
