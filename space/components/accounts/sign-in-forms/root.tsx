import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// hooks
import useSignInRedirection from "hooks/use-sign-in-redirection";
// services
import { AppConfigService } from "services/app-config.service";
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
  SelfHostedSignInForm,
} from "components/accounts";

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

const appConfig = new AppConfigService();

export const SignInRoot = observer(() => {
  // states
  const [signInStep, setSignInStep] = useState<ESignInSteps>(ESignInSteps.EMAIL);
  const [email, setEmail] = useState("");
  const [isOnboarded, setIsOnboarded] = useState(false);
  // sign in redirection hook
  const { handleRedirection } = useSignInRedirection();

  const { data: envConfig } = useSWR("APP_CONFIG", () => appConfig.envConfig());

  const isOAuthEnabled = envConfig && (envConfig.google_client_id || envConfig.github_client_id);
  return (
    <>
      <div className="mx-auto flex flex-col">
        {envConfig?.is_self_managed ? (
          <SelfHostedSignInForm
            email={email}
            updateEmail={(newEmail) => setEmail(newEmail)}
            handleSignInRedirection={handleRedirection}
          />
        ) : (
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
                submitButtonLabel="Go to board"
                showTermsAndConditions
                updateUserOnboardingStatus={(value) => setIsOnboarded(value)}
              />
            )}
            {signInStep === ESignInSteps.UNIQUE_CODE && (
              <UniqueCodeForm
                email={email}
                updateEmail={(newEmail) => setEmail(newEmail)}
                handleStepChange={(step) => setSignInStep(step)}
                handleSignInRedirection={handleRedirection}
                updateUserOnboardingStatus={(value) => setIsOnboarded(value)}
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
        )}
      </div>
      {isOAuthEnabled &&
        !OAUTH_HIDDEN_STEPS.includes(signInStep) &&
        signInStep !== ESignInSteps.CREATE_PASSWORD &&
        signInStep !== ESignInSteps.PASSWORD && <OAuthOptions handleSignInRedirection={handleRedirection} />}
      <LatestFeatureBlock />
    </>
  );
});
