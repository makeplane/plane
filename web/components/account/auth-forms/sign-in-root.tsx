import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { IEmailCheckData } from "@plane/types";
import { Spinner, TOAST_TYPE, setToast } from "@plane/ui";
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

export const SignInAuthRoot = observer(() => {
  //router
  const router = useRouter();
  const { email: emailParam, invitation_id, slug: workspaceSlug, error_code, error_message } = router.query;
  // states
  const [authStep, setAuthStep] = useState<EAuthSteps>(EAuthSteps.EMAIL);
  const [email, setEmail] = useState(emailParam ? emailParam.toString() : "");
  const [isLoading, setIsLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<TAuthErrorInfo | undefined>(undefined);
  // hooks
  const { instance } = useInstance();
  // derived values
  const authMode = EAuthModes.SIGN_IN;

  useEffect(() => {
    if (error_code && error_message) {
      const errorhandler = authErrorHandler(
        error_code?.toString() as EAuthenticationErrorCodes,
        error_message?.toString()
      );
      if (errorhandler) setErrorInfo(errorhandler);
    }
  }, [error_code, error_message]);

  // step 1 submit handler- email verification
  const handleEmailVerification = async (data: IEmailCheckData) => {
    setEmail(data.email);

    await authService
      .signInEmailCheck(data)
      .then(() => {
        setAuthStep(EAuthSteps.PASSWORD);
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.error_message ?? "Something went wrong. Please try again.",
        });
      });
  };

  const isOAuthEnabled =
    instance?.config && (instance?.config?.is_google_enabled || instance?.config?.is_github_enabled);

  if (isLoading)
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner />
      </div>
    );

  return (
    <div className="relative flex flex-col space-y-6">
      <AuthHeader
        workspaceSlug={workspaceSlug?.toString() || undefined}
        invitationId={invitation_id?.toString() || undefined}
        invitationEmail={email || undefined}
        authMode={EAuthModes.SIGN_IN}
        currentAuthStep={authStep}
        handleLoader={setIsLoading}
      />
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
    </div>
  );
});
