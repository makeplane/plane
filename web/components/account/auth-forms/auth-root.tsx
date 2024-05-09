import React, { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { IEmailCheckData } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
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

        // validating weather to show alert to banner
        if (errorhandler?.type === EErrorAlertType.TOAST_ALERT) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: errorhandler?.title,
            message: errorhandler?.message as string,
          });
        } else setErrorInfo(errorhandler);
      }
    }
  }, [error_code, authMode]);

  // step 1 submit handler- email verification
  const handleEmailVerification = async (data: IEmailCheckData) => {
    setEmail(data.email);

    const emailCheckRequest =
      authMode === EAuthModes.SIGN_IN ? authService.signInEmailCheck(data) : authService.signUpEmailCheck(data);

    await emailCheckRequest
      .then((response) => {
        if (authMode === EAuthModes.SIGN_IN) {
          if (response.is_password_autoset) setAuthStep(EAuthSteps.UNIQUE_CODE);
          else setAuthStep(EAuthSteps.PASSWORD);
        } else {
          if (instance && instance?.config?.is_smtp_configured) setAuthStep(EAuthSteps.UNIQUE_CODE);
          else setAuthStep(EAuthSteps.PASSWORD);
        }
      })
      .catch((error) => {
        const errorhandler = authErrorHandler(error?.error_code.toString(), data?.email || undefined);
        if (errorhandler?.type === EErrorAlertType.BANNER_ALERT) {
          setErrorInfo(errorhandler);
          return;
        } else if (errorhandler?.type === EErrorAlertType.TOAST_ALERT)
          setToast({
            type: TOAST_TYPE.ERROR,
            title: errorhandler?.title,
            message: (errorhandler?.message as string) || "Something went wrong. Please try again.",
          });
      });
  };

  const isOAuthEnabled =
    instance?.config && (instance?.config?.is_google_enabled || instance?.config?.is_github_enabled);

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
            email={email}
            handleEmailClear={() => {
              setEmail("");
              setAuthStep(EAuthSteps.EMAIL);
            }}
            submitButtonText="Continue"
            mode={authMode}
          />
        )}
        {authStep === EAuthSteps.PASSWORD && (
          <AuthPasswordForm
            email={email}
            handleEmailClear={() => {
              setEmail("");
              setAuthStep(EAuthSteps.EMAIL);
            }}
            handleStepChange={(step) => setAuthStep(step)}
            mode={authMode}
          />
        )}
        {isOAuthEnabled && <OAuthOptions />}
        <TermsAndConditions isSignUp={false} />
      </AuthHeader>
    </div>
  );
});
