"use client";

import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
// components
import { AuthBanner } from "@/components/account";
// helpers
import {
  authErrorHandler,
  EAuthenticationErrorCodes,
  EAuthSteps,
  EErrorAlertType,
  TAuthErrorInfo,
} from "@/helpers/authentication.helper";
// hooks
import { useInstance } from "@/hooks/store";
// plane web components
import {
  MobileTermsAndConditions,
  MobileAuthEmailValidationForm,
  MobileAuthUniqueCodeForm,
  MobileAuthPasswordForm,
  OAuthRoot,
} from "@/plane-web/components/mobile";
// services
import mobileAuthService from "@/plane-web/services/mobile.service";

// constants
const AUTH_HEADER_CONTENT_OPTIONS = {
  [EAuthSteps.EMAIL]: {
    title: "Log in",
    description: undefined,
  },
  [EAuthSteps.UNIQUE_CODE]: {
    title: "Log in",
    description: "Log in using your unique code.",
  },
  [EAuthSteps.PASSWORD]: {
    title: "Log in",
    description: "Log in using your password.",
  },
};

const UNIQUE_CODE_ERROR_CODES = [
  EAuthenticationErrorCodes.INVALID_MAGIC_CODE_SIGN_IN,
  EAuthenticationErrorCodes.INVALID_EMAIL_MAGIC_SIGN_IN,
  EAuthenticationErrorCodes.EXPIRED_MAGIC_CODE_SIGN_IN,
  EAuthenticationErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN,
];

const PASSWORD_ERROR_CODES = [EAuthenticationErrorCodes.AUTHENTICATION_FAILED_SIGN_IN];

// oauth error codes
const OAUTH_ERROR_CODES = [
  EAuthenticationErrorCodes.OAUTH_NOT_CONFIGURED,
  EAuthenticationErrorCodes.GOOGLE_NOT_CONFIGURED,
  EAuthenticationErrorCodes.GITHUB_NOT_CONFIGURED,
  EAuthenticationErrorCodes.GOOGLE_OAUTH_PROVIDER_ERROR,
  EAuthenticationErrorCodes.GITHUB_OAUTH_PROVIDER_ERROR,
  EAuthenticationErrorCodes.GITLAB_OAUTH_PROVIDER_ERROR,
  EAuthenticationErrorCodes.MOBILE_SIGNUP_DISABLED,
];

export const AuthRoot: FC = observer(() => {
  // router
  const searchParams = useSearchParams();
  // query params
  const emailParam = searchParams.get("email");
  const errorCodeParam = searchParams.get("error_code");
  const errorMessageParam = searchParams.get("error_message");
  const sessionToken = searchParams.get("token");
  // hooks
  const { config } = useInstance();
  // states
  const [email, setEmail] = useState(emailParam ? emailParam.toString() : "");
  const [authStep, setAuthStep] = useState<EAuthSteps>(EAuthSteps.EMAIL);
  const [errorInfo, setErrorInfo] = useState<TAuthErrorInfo | undefined>(undefined);

  const handleErrorInfo = (value: TAuthErrorInfo | undefined) => {
    setErrorInfo(value);
  };

  // derived values
  const isSMTPConfigured = config?.is_smtp_configured || false;

  // generating unique email code
  const generateEmailUniqueCode = async (email: string) => {
    if (!isSMTPConfigured || !email || email === "") return;
    const payload = { email: email };
    return await mobileAuthService
      .generateUniqueCode(payload)
      .then(() => ({ code: "" }))
      .catch((error) => {
        const errorhandler = authErrorHandler(error?.error_code.toString());
        if (errorhandler?.type) setErrorInfo(errorhandler);
        throw error;
      });
  };

  // validating and defining the errors
  useEffect(() => {
    if (!errorCodeParam) return;
    const errorhandler = authErrorHandler(errorCodeParam?.toString() as EAuthenticationErrorCodes);
    if (!errorhandler) return;
    // password handler
    if (PASSWORD_ERROR_CODES.includes(errorhandler.code)) setAuthStep(EAuthSteps.PASSWORD);
    // unique code handler
    if (UNIQUE_CODE_ERROR_CODES.includes(errorhandler.code)) setAuthStep(EAuthSteps.UNIQUE_CODE);
    // oauth signup handler
    if (OAUTH_ERROR_CODES.includes(errorhandler.code)) setErrorInfo(errorhandler);
    setErrorInfo(errorhandler);
  }, [errorCodeParam, errorMessageParam]);

  useEffect(() => {
    if (sessionToken) {
      window.location.replace(`app.plane.so://?token=${sessionToken}`);
    }
  }, [sessionToken]);

  return (
    <div className="relative flex flex-col space-y-4">
      {/* heading */}
      <div className="space-y-1 text-center">
        <h3 className="text-3xl font-bold text-onboarding-text-100">{AUTH_HEADER_CONTENT_OPTIONS[authStep]?.title}</h3>
        {AUTH_HEADER_CONTENT_OPTIONS[authStep]?.description && (
          <p className="font-medium text-onboarding-text-400">{AUTH_HEADER_CONTENT_OPTIONS[authStep]?.description}</p>
        )}
      </div>

      {/* alert banner */}
      {errorInfo && errorInfo?.type === EErrorAlertType.BANNER_ALERT && (
        <AuthBanner bannerData={errorInfo} handleBannerData={handleErrorInfo} />
      )}

      {/* auth content */}
      <div>
        {authStep === EAuthSteps.EMAIL && (
          <MobileAuthEmailValidationForm
            email={email}
            handleEmail={(value) => setEmail(value)}
            handleAuthStep={(value) => setAuthStep(value)}
            handleErrorInfo={handleErrorInfo}
            generateEmailUniqueCode={generateEmailUniqueCode}
          />
        )}
        {authStep === EAuthSteps.UNIQUE_CODE && (
          <MobileAuthUniqueCodeForm
            email={email}
            handleEmail={(value) => setEmail(value)}
            handleAuthStep={(value) => setAuthStep(value)}
            generateEmailUniqueCode={generateEmailUniqueCode}
          />
        )}
        {authStep === EAuthSteps.PASSWORD && (
          <MobileAuthPasswordForm
            email={email}
            handleEmail={(value) => setEmail(value)}
            handleAuthStep={(value) => setAuthStep(value)}
            generateEmailUniqueCode={generateEmailUniqueCode}
          />
        )}
      </div>

      {/* oauth */}
      <OAuthRoot />

      {/* terms and conditions */}
      <MobileTermsAndConditions />
    </div>
  );
});
