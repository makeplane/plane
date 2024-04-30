import { FC, useState } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// types
import { IEmailCheckData } from "@plane/types";
// ui
import { Spinner, TOAST_TYPE, setToast } from "@plane/ui";
// components
import {
  AuthHeader,
  AuthBanner,
  AuthEmailForm,
  AuthPasswordForm,
  OAuthOptions,
  TermsAndConditions,
  UniqueCodeForm,
} from "@/components/account";
// helpers
import { EAuthModes, EAuthSteps, EErrorAlertType, TAuthErrorInfo } from "@/helpers/authentication.helper";
// hooks
import { useInstance } from "@/hooks/store";
// services
import { AuthService } from "@/services/auth.service";

// service initialization
const authService = new AuthService();

export const SignUpAuthRoot: FC = observer(() => {
  //router
  const router = useRouter();
  const { email: emailParam, invitation_id, slug: workspaceSlug } = router.query;
  // states
  const [authStep, setAuthStep] = useState<EAuthSteps>(EAuthSteps.EMAIL);
  const [email, setEmail] = useState(emailParam ? emailParam.toString() : "");
  const [isLoading, setIsLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<TAuthErrorInfo | undefined>(undefined);
  // hooks
  const { instance } = useInstance();
  // derived values
  const authMode = EAuthModes.SIGN_UP;
  const isSmtpConfigured = instance?.config?.is_smtp_configured;

  // const redirectToSignUp = (email: string) => {
  //   if (isEmpty(email)) router.push({ pathname: "/", query: router.query });
  //   else router.push({ pathname: "/", query: { ...router.query, email: email } });
  // };

  // step 1 - email verification
  const handleEmailVerification = async (data: IEmailCheckData) => {
    setEmail(data.email);
    await authService
      .signUpEmailCheck(data)
      .then(() => {
        if (isSmtpConfigured) setAuthStep(EAuthSteps.UNIQUE_CODE);
        else setAuthStep(EAuthSteps.PASSWORD);
      })
      .catch((err) => {
        console.log("error", err);
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
    <>
      <div className="relative max-w-lg mx-auto flex flex-col space-y-6">
        <AuthHeader
          workspaceSlug={workspaceSlug?.toString() || undefined}
          invitationId={invitation_id?.toString() || undefined}
          invitationEmail={emailParam?.toString() || undefined}
          authMode={EAuthModes.SIGN_UP}
          currentAuthStep={authStep}
          handleLoader={setIsLoading}
        />

        {errorInfo && errorInfo?.type === EErrorAlertType.BANNER_ALERT && (
          <AuthBanner bannerData={errorInfo} handleBannerData={(value) => setErrorInfo(value)} />
        )}

        {authStep === EAuthSteps.EMAIL && <AuthEmailForm defaultEmail={email} onSubmit={handleEmailVerification} />}

        {authStep === EAuthSteps.UNIQUE_CODE && (
          <UniqueCodeForm
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
      </div>
    </>
  );
});
