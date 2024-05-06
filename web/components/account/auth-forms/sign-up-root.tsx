import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// types
import { IEmailCheckData } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import {
  AuthHeader,
  AuthBanner,
  AuthEmailForm,
  AuthUniqueCodeForm,
  AuthPasswordForm,
  OAuthOptions,
  TermsAndConditions,
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

// service initialization
const authService = new AuthService();

export const SignUpAuthRoot: FC = observer(() => {
  //router
  const router = useRouter();
  const { email: emailParam, invitation_id, slug: workspaceSlug, error_code, error_message } = router.query;
  // states
  const [authStep, setAuthStep] = useState<EAuthSteps>(EAuthSteps.EMAIL);
  const [email, setEmail] = useState(emailParam ? emailParam.toString() : "");
  const [errorInfo, setErrorInfo] = useState<TAuthErrorInfo | undefined>(undefined);
  // hooks
  const { instance } = useInstance();
  // derived values
  const authMode = EAuthModes.SIGN_UP;
  const isSmtpConfigured = instance?.config?.is_smtp_configured;

  useEffect(() => {
    if (error_code && error_message) {
      const errorhandler = authErrorHandler(
        error_code?.toString() as EAuthenticationErrorCodes,
        error_message?.toString()
      );
      if (errorhandler) {
        if (errorhandler?.type === EErrorAlertType.TOAST_ALERT) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: errorhandler?.title,
            message: errorhandler?.message as string,
          });
        } else setErrorInfo(errorhandler);
      }
    }
  }, [error_code, error_message]);

  // email verification
  const handleEmailVerification = async (data: IEmailCheckData) => {
    setEmail(data.email);
    await authService
      .signUpEmailCheck(data)
      .then(() => {
        if (isSmtpConfigured) setAuthStep(EAuthSteps.UNIQUE_CODE);
        else setAuthStep(EAuthSteps.PASSWORD);
      })
      .catch((error) => {
        const errorhandler = authErrorHandler(error?.error_code, error?.error_message);
        if (errorhandler) {
          setErrorInfo(errorhandler);
          return;
        }
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error_message ?? "Something went wrong. Please try again.",
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
        authMode={EAuthModes.SIGN_UP}
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
        <TermsAndConditions isSignUp={authMode === EAuthModes.SIGN_UP} />
      </AuthHeader>
    </div>
  );
});
