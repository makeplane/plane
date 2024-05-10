import React, { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { IEmailCheckData } from "@plane/types";
// components
import {
  AuthHeader,
  AuthBanner,
  AuthEmailForm,
  AuthPasswordForm,
  OAuthOptions,
  TermsAndConditions,
  AuthUniqueCodeForm,
} from "@/components/account";
// helpers
import {
  EAuthModes,
  EAuthSteps,
  EAuthenticationErrorCodes,
  EErrorAlertType,
  TAuthErrorInfo,
  authErrorHandler,
} from "@/helpers/authentication.helper";
// hooks
import { useInstance } from "@/hooks/store";
// services
import { AuthService } from "@/services/auth.service";

const authService = new AuthService();

type TAuthRoot = {
  authMode: EAuthModes;
};

export const AuthRoot: FC<TAuthRoot> = observer((props) => {
  //router
  const router = useRouter();
  const { email: emailParam, invitation_id, slug: workspaceSlug, error_code } = router.query;
  // props
  const { authMode } = props;
  // states
  const [authStep, setAuthStep] = useState<EAuthSteps>(EAuthSteps.EMAIL);
  const [email, setEmail] = useState(emailParam ? emailParam.toString() : "");
  const [errorInfo, setErrorInfo] = useState<TAuthErrorInfo | undefined>(undefined);
  const [isPasswordAutoset, setIsPasswordAutoset] = useState(true);
  // hooks
  const { instance } = useInstance();

  useEffect(() => {
    if (error_code) {
      const errorhandler = authErrorHandler(error_code?.toString() as EAuthenticationErrorCodes);
      if (errorhandler) {
        if (
          [
            EAuthenticationErrorCodes.AUTHENTICATION_FAILED_SIGN_IN,
            EAuthenticationErrorCodes.AUTHENTICATION_FAILED_SIGN_UP,
          ].includes(errorhandler.code)
        )
          setAuthStep(EAuthSteps.PASSWORD);
        if (
          [EAuthenticationErrorCodes.INVALID_MAGIC_CODE, EAuthenticationErrorCodes.EXPIRED_MAGIC_CODE].includes(
            errorhandler.code
          )
        )
          setAuthStep(EAuthSteps.UNIQUE_CODE);
        setErrorInfo(errorhandler);
      }
    }
  }, [error_code, authMode]);

  // submit handler- email verification
  const handleEmailVerification = async (data: IEmailCheckData) => {
    setEmail(data.email);
    const emailCheckRequest =
      authMode === EAuthModes.SIGN_IN ? authService.signInEmailCheck(data) : authService.signUpEmailCheck(data);

    await emailCheckRequest
      .then(async (response) => {
        if (authMode === EAuthModes.SIGN_IN) {
          if (response.is_password_autoset) {
            setAuthStep(EAuthSteps.UNIQUE_CODE);
            generateEmailUniqueCode(data.email);
          } else {
            setIsPasswordAutoset(false);
            setAuthStep(EAuthSteps.PASSWORD);
          }
        } else {
          if (instance && instance?.config?.is_smtp_configured) {
            setAuthStep(EAuthSteps.UNIQUE_CODE);
            generateEmailUniqueCode(data.email);
          } else setAuthStep(EAuthSteps.PASSWORD);
        }
      })
      .catch((error) => {
        const errorhandler = authErrorHandler(error?.error_code.toString(), data?.email || undefined);
        if (errorhandler?.type) setErrorInfo(errorhandler);
      });
  };

  // generating the unique code
  const generateEmailUniqueCode = async (email: string): Promise<{ code: string } | undefined> => {
    const payload = { email: email };
    return await authService
      .generateUniqueCode(payload)
      .then(() => ({ code: "" }))
      .catch((error) => {
        const errorhandler = authErrorHandler(error?.error_code.toString());
        if (errorhandler?.type) setErrorInfo(errorhandler);
        throw error;
      });
  };

  const isOAuthEnabled =
    (instance?.config && (instance?.config?.is_google_enabled || instance?.config?.is_github_enabled)) || false;

  const isSMTPConfigured = (instance?.config && instance?.config?.is_smtp_configured) || false;

  return (
    <div className="relative flex flex-col space-y-6">
      <AuthHeader
        workspaceSlug={workspaceSlug?.toString() || undefined}
        invitationId={invitation_id?.toString() || undefined}
        invitationEmail={email || undefined}
        authMode={authMode}
        currentAuthStep={authStep}
      >
        {errorInfo && errorInfo?.type === EErrorAlertType.BANNER_ALERT && (
          <AuthBanner bannerData={errorInfo} handleBannerData={(value) => setErrorInfo(value)} />
        )}
        {authStep === EAuthSteps.EMAIL && <AuthEmailForm defaultEmail={email} onSubmit={handleEmailVerification} />}
        {authStep === EAuthSteps.UNIQUE_CODE && (
          <AuthUniqueCodeForm
            mode={authMode}
            email={email}
            handleEmailClear={() => {
              setEmail("");
              setAuthStep(EAuthSteps.EMAIL);
            }}
            generateEmailUniqueCode={generateEmailUniqueCode}
          />
        )}
        {authStep === EAuthSteps.PASSWORD && (
          <AuthPasswordForm
            mode={authMode}
            isPasswordAutoset={isPasswordAutoset}
            isSMTPConfigured={isSMTPConfigured}
            email={email}
            handleEmailClear={() => {
              setEmail("");
              setAuthStep(EAuthSteps.EMAIL);
            }}
            handleAuthStep={(step: EAuthSteps) => {
              if (step === EAuthSteps.UNIQUE_CODE) generateEmailUniqueCode(email);
              setAuthStep(step);
            }}
          />
        )}
        {isOAuthEnabled && <OAuthOptions />}
        <TermsAndConditions isSignUp={false} />
      </AuthHeader>
    </div>
  );
});
