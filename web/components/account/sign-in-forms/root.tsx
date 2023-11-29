import React, { useState } from "react";
// components
import { EmailForm, UniqueCodeForm, PasswordForm, SetPasswordLink } from "components/account";

export enum ESignInSteps {
  EMAIL = "EMAIL",
  PASSWORD = "PASSWORD",
  SET_PASSWORD_LINK = "SET_PASSWORD_LINK",
  UNIQUE_CODE = "UNIQUE_CODE",
  OPTIONAL_SET_PASSWORD = "OPTIONAL_SET_PASSWORD",
}

type Props = {
  handleSignInRedirection: () => Promise<void>;
};

export const SignInRoot: React.FC<Props> = (props) => {
  const { handleSignInRedirection } = props;
  // states
  const [signInStep, setSignInStep] = useState<ESignInSteps>(ESignInSteps.EMAIL);
  const [email, setEmail] = useState("");

  return (
    <>
      {signInStep === ESignInSteps.EMAIL && (
        <EmailForm
          handleNextStep={(step: ESignInSteps) => setSignInStep(step)}
          updateEmail={(newEmail) => setEmail(newEmail)}
        />
      )}
      {signInStep === ESignInSteps.PASSWORD && (
        <PasswordForm
          email={email}
          updateEmail={(newEmail) => setEmail(newEmail)}
          handleNextStep={(step: ESignInSteps) => setSignInStep(step)}
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
          handleSignInRedirection={handleSignInRedirection}
        />
      )}
    </>
  );
};
