"use client";

import { FC, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  EMobileAuthSteps,
  EMobileAuthModes,
  EMobileErrorAlertType,
  TMobileAuthSteps,
  TMobileAuthModes,
  TMobileAuthErrorInfo,
  EMobileAuthErrorCodes,
  TMobileAuthErrorCodes,
} from "@plane/constants";
import { TInstanceConfig, TMobileWorkspaceInvitation } from "@plane/types";
import { mobileAuthErrorHandler } from "@plane/utils";
// plane web components
import {
  MobileAuthBanner,
  MobileTermsAndConditions,
  MobileAuthEmailValidationForm,
  MobileAuthUniqueCodeForm,
  MobileAuthPasswordForm,
  OAuthRoot,
  MobileAuthHeader,
  MobileAuthInvitationWrapper,
} from "@/plane-web/components/mobile";
// services
import mobileAuthService from "@/plane-web/services/mobile.service";

const UNIQUE_CODE_ERROR_CODES = [
  EMobileAuthErrorCodes.INVALID_MAGIC_CODE_SIGN_IN,
  EMobileAuthErrorCodes.INVALID_EMAIL_MAGIC_SIGN_IN,
  EMobileAuthErrorCodes.EXPIRED_MAGIC_CODE_SIGN_IN,
  EMobileAuthErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN,
];

const PASSWORD_ERROR_CODES = [EMobileAuthErrorCodes.AUTHENTICATION_FAILED_SIGN_IN];

// oauth error codes
const OAUTH_ERROR_CODES = [
  EMobileAuthErrorCodes.OAUTH_NOT_CONFIGURED,
  EMobileAuthErrorCodes.GOOGLE_NOT_CONFIGURED,
  EMobileAuthErrorCodes.GITHUB_NOT_CONFIGURED,
  EMobileAuthErrorCodes.GOOGLE_OAUTH_PROVIDER_ERROR,
  EMobileAuthErrorCodes.GITHUB_OAUTH_PROVIDER_ERROR,
  EMobileAuthErrorCodes.GITLAB_OAUTH_PROVIDER_ERROR,
  EMobileAuthErrorCodes.MOBILE_SIGNUP_DISABLED,
];

type TAuthRoot = {
  config: TInstanceConfig;
};

export const AuthRoot: FC<TAuthRoot> = (props) => {
  const { config } = props;
  // router
  const searchParams = useSearchParams();
  // query params
  const invitationIdParam = searchParams.get("invitation_id") || undefined;
  const emailParam = searchParams.get("email");
  const errorCodeParam = searchParams.get("error_code");
  const errorMessageParam = searchParams.get("error_message");
  const sessionToken = searchParams.get("token");
  // states
  const [authMode, setAuthMode] = useState<TMobileAuthModes>(EMobileAuthModes.SIGN_IN);
  const [email, setEmail] = useState(emailParam ? emailParam.toString() : "");
  const [authStep, setAuthStep] = useState<TMobileAuthSteps>(EMobileAuthSteps.EMAIL);
  const [errorInfo, setErrorInfo] = useState<TMobileAuthErrorInfo | undefined>(undefined);
  const [invitationDetails, setInvitationDetails] = useState<TMobileWorkspaceInvitation | undefined>(undefined);

  const handleErrorInfo = (value: TMobileAuthErrorInfo | undefined) => {
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
        const errorhandler = mobileAuthErrorHandler(error?.error_code.toString());
        if (errorhandler?.type) setErrorInfo(errorhandler);
        throw error;
      });
  };

  // validating and defining the errors
  useEffect(() => {
    if (!errorCodeParam) return;
    const errorhandler = mobileAuthErrorHandler(errorCodeParam?.toString() as TMobileAuthErrorCodes);
    if (!errorhandler) return;
    // password handler
    if (PASSWORD_ERROR_CODES.includes(errorhandler.code)) setAuthStep(EMobileAuthSteps.PASSWORD);
    // unique code handler
    if (UNIQUE_CODE_ERROR_CODES.includes(errorhandler.code)) setAuthStep(EMobileAuthSteps.UNIQUE_CODE);
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
    <MobileAuthInvitationWrapper
      invitationId={invitationIdParam || undefined}
      email={emailParam || undefined}
      handleInvitationDetails={(value) => setInvitationDetails(value)}
    >
      <div className="space-y-4">
        {/* heading */}
        <MobileAuthHeader invitationDetails={invitationDetails} authMode={authMode} authStep={authStep} />

        {/* alert banner */}
        {errorInfo && errorInfo?.type === EMobileErrorAlertType.BANNER_ALERT && (
          <MobileAuthBanner bannerData={errorInfo} handleBannerData={handleErrorInfo} />
        )}

        {/* oauth */}
        <OAuthRoot invitationDetails={invitationDetails} config={config} />

        {/* auth content */}
        <div>
          {authStep === EMobileAuthSteps.EMAIL && (
            <MobileAuthEmailValidationForm
              email={email}
              handleEmail={(value) => setEmail(value)}
              handleAuthStep={(value) => setAuthStep(value)}
              handleAuthMode={(value) => setAuthMode(value)}
              handleErrorInfo={handleErrorInfo}
              generateEmailUniqueCode={generateEmailUniqueCode}
            />
          )}
          {authStep === EMobileAuthSteps.UNIQUE_CODE && (
            <MobileAuthUniqueCodeForm
              authMode={authMode}
              invitationId={invitationIdParam}
              email={email}
              handleEmail={(value) => setEmail(value)}
              handleAuthStep={(value) => setAuthStep(value)}
              generateEmailUniqueCode={generateEmailUniqueCode}
            />
          )}
          {authStep === EMobileAuthSteps.PASSWORD && (
            <MobileAuthPasswordForm
              authMode={authMode}
              invitationId={invitationIdParam}
              email={email}
              handleEmail={(value) => setEmail(value)}
              handleAuthStep={(value) => setAuthStep(value)}
              generateEmailUniqueCode={generateEmailUniqueCode}
              isSMTPConfigured={isSMTPConfigured}
            />
          )}
        </div>

        {/* terms and conditions */}
        <MobileTermsAndConditions />
      </div>
    </MobileAuthInvitationWrapper>
  );
};
