"use client";

import React, { FC, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useSearchParams } from "next/navigation";
import { IEmailCheckData } from "@plane/types";
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
  EAuthenticationErrorCodes,
  EErrorAlertType,
  TAuthErrorInfo,
  authErrorHandler,
} from "@/helpers/authentication.helper";
// hooks
import { useInstance } from "@/hooks/store";
// services
import { AuthService } from "@/services/auth.service";
// types
import { EAuthModes, EAuthSteps } from "@/types/auth";

const authService = new AuthService();

export const AuthRoot: FC = observer(() => {
  // router params
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || undefined;
  const error_code = searchParams.get("error_code") || undefined;
  // states
  const [authMode, setAuthMode] = useState<EAuthModes>(EAuthModes.SIGN_UP);
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
  }, [error_code]);

  const isSMTPConfigured = instance?.config?.is_smtp_configured || false;
  const isMagicLoginEnabled = instance?.config?.is_magic_login_enabled || false;
  const isEmailPasswordEnabled = instance?.config?.is_email_password_enabled || false;
  const isOAuthEnabled =
    (instance?.config && (instance?.config?.is_google_enabled || instance?.config?.is_github_enabled)) || false;

  // submit handler- email verification
  const handleEmailVerification = async (data: IEmailCheckData) => {
    setEmail(data.email);

    await authService
      .emailCheck(data)
      .then(async (response) => {
        let currentAuthMode: EAuthModes = EAuthModes.SIGN_UP;
        if (response.existing) {
          currentAuthMode = EAuthModes.SIGN_IN;
          setAuthMode(() => EAuthModes.SIGN_IN);
        } else {
          currentAuthMode = EAuthModes.SIGN_UP;
          setAuthMode(() => EAuthModes.SIGN_UP);
        }

        if (currentAuthMode === EAuthModes.SIGN_IN) {
          if (response.is_password_autoset && isSMTPConfigured && isMagicLoginEnabled) {
            setAuthStep(EAuthSteps.UNIQUE_CODE);
            generateEmailUniqueCode(data.email);
          } else if (isEmailPasswordEnabled) {
            setIsPasswordAutoset(false);
            setAuthStep(EAuthSteps.PASSWORD);
          } else {
            const errorhandler = authErrorHandler("5005" as EAuthenticationErrorCodes);
            setErrorInfo(errorhandler);
          }
        } else {
          if (isSMTPConfigured && isMagicLoginEnabled) {
            setAuthStep(EAuthSteps.UNIQUE_CODE);
            generateEmailUniqueCode(data.email);
          } else if (isEmailPasswordEnabled) {
            setAuthStep(EAuthSteps.PASSWORD);
          } else {
            const errorhandler = authErrorHandler("5006" as EAuthenticationErrorCodes);
            setErrorInfo(errorhandler);
          }
        }
      })
      .catch((error) => {
        const errorhandler = authErrorHandler(error?.error_code?.toString(), data?.email || undefined);
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

  return (
    <div className="relative flex flex-col space-y-6">
      <AuthHeader authMode={authMode}>
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
        <TermsAndConditions isSignUp={authMode === EAuthModes.SIGN_UP ? true : false} />
      </AuthHeader>
    </div>
  );
});
