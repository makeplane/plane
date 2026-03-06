/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { observer } from "mobx-react";
// plane internal packages
import type { EAdminAuthErrorCodes, TAdminAuthErrorInfo } from "@plane/constants";
import { AuthService } from "@plane/services";
import { OAuthOptions } from "@plane/ui";
// components
import { Banner } from "@/components/common/banner";
import { FormHeader } from "@/components/instance/form-header";
// helpers
import { decodeEmailFromUrl } from "@/helpers/authentication";
// hooks
import { useAdminOAuthSignIn } from "@/hooks/oauth/sign-in";
import { useInstance } from "@/hooks/store";
// local components
import { AuthBanner } from "./auth-banner";
import { AuthHeader } from "./auth-header";
import { authErrorHandler } from "./auth-helpers";
import { EmailForm } from "./email-form";
import { MagicLinkForm } from "./magic-link-form";
import { PasswordForm } from "./password-form";

// service initialization
const authService = new AuthService();

// error codes
enum EErrorCodes {
  INSTANCE_NOT_CONFIGURED = "INSTANCE_NOT_CONFIGURED",
  REQUIRED_EMAIL_PASSWORD = "REQUIRED_EMAIL_PASSWORD",
  INVALID_EMAIL = "INVALID_EMAIL",
  USER_DOES_NOT_EXIST = "USER_DOES_NOT_EXIST",
  AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED",
}

type TError = {
  type: EErrorCodes | undefined;
  message: string | undefined;
};

enum EAdminAuthStep {
  EMAIL = "EMAIL",
  PASSWORD = "PASSWORD",
  MAGIC_CODE = "MAGIC_CODE",
}

export const InstanceSignInForm = observer(function InstanceSignInForm() {
  // search params
  const searchParams = useSearchParams();
  const encodedEmail = searchParams.get("ctx");
  const emailParam = decodeEmailFromUrl(encodedEmail);
  const errorCode = searchParams.get("error_code") || undefined;
  const errorMessage = searchParams.get("error_message") || undefined;
  // store hooks
  const { config } = useInstance();
  const { isOAuthEnabled, oAuthOptions } = useAdminOAuthSignIn();
  // state
  const [authStep, setAuthStep] = useState<EAdminAuthStep>(EAdminAuthStep.EMAIL);
  const [email, setEmail] = useState(emailParam || "");
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  const [errorInfo, setErrorInfo] = useState<TAdminAuthErrorInfo | undefined>(undefined);
  // derived values
  const isMagicLoginEnabled = config?.is_magic_login_enabled && config?.is_smtp_configured;

  useEffect(() => {
    if (csrfToken === undefined) {
      void authService.requestCSRFToken().then((data) => data?.csrf_token && setCsrfToken(data.csrf_token));
    }
  }, [csrfToken]);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  // derived values
  const errorData: TError = useMemo(() => {
    if (errorCode && errorMessage) {
      const code = errorCode as EErrorCodes;
      switch (code) {
        case EErrorCodes.INSTANCE_NOT_CONFIGURED:
          return { type: EErrorCodes.INSTANCE_NOT_CONFIGURED, message: errorMessage };
        case EErrorCodes.REQUIRED_EMAIL_PASSWORD:
          return { type: EErrorCodes.REQUIRED_EMAIL_PASSWORD, message: errorMessage };
        case EErrorCodes.INVALID_EMAIL:
          return { type: EErrorCodes.INVALID_EMAIL, message: errorMessage };
        case EErrorCodes.USER_DOES_NOT_EXIST:
          return { type: EErrorCodes.USER_DOES_NOT_EXIST, message: errorMessage };
        case EErrorCodes.AUTHENTICATION_FAILED:
          return { type: EErrorCodes.AUTHENTICATION_FAILED, message: errorMessage };
        default:
          return { type: undefined, message: undefined };
      }
    } else return { type: undefined, message: undefined };
  }, [errorCode, errorMessage]);

  useEffect(() => {
    if (errorCode) {
      const errorDetail = authErrorHandler(errorCode?.toString() as EAdminAuthErrorCodes);
      if (errorDetail) {
        setErrorInfo(errorDetail);
      }
    }
  }, [errorCode]);

  const handleEmailClear = () => {
    setEmail("");
    setAuthStep(EAdminAuthStep.EMAIL);
    setErrorInfo(undefined);
  };

  const handleError = (error: TAdminAuthErrorInfo) => {
    setErrorInfo(error);
  };

  return (
    <>
      <AuthHeader />
      <div className="flex flex-col justify-center items-center flex-grow w-full py-6 mt-10">
        <div className="relative flex flex-col gap-6 max-w-[22.5rem] w-full">
          <FormHeader
            heading="Manage your Plane instance"
            subHeading="Configure instance-wide settings to secure your instance"
          />
          {errorData.type && errorData?.message ? (
            <Banner type="error" message={errorData?.message} />
          ) : (
            <>{errorInfo && <AuthBanner bannerData={errorInfo} handleBannerData={(value) => setErrorInfo(value)} />}</>
          )}
          {isOAuthEnabled && <OAuthOptions options={oAuthOptions} showDivider />}
          {/* Step 1: Email input */}
          {authStep === EAdminAuthStep.EMAIL && (
            <EmailForm
              email={email}
              onEmailChange={setEmail}
              onPasswordStep={() => setAuthStep(EAdminAuthStep.PASSWORD)}
              onMagicCodeStep={() => setAuthStep(EAdminAuthStep.MAGIC_CODE)}
              onError={handleError}
            />
          )}
          {/* Step 2a: Password form */}
          {authStep === EAdminAuthStep.PASSWORD && (
            <PasswordForm
              email={email}
              csrfToken={csrfToken}
              onEmailClear={handleEmailClear}
              onSwitchToMagicCode={isMagicLoginEnabled ? () => setAuthStep(EAdminAuthStep.MAGIC_CODE) : undefined}
            />
          )}
          {/* Step 2b: Magic code form */}
          {authStep === EAdminAuthStep.MAGIC_CODE && (
            <MagicLinkForm
              email={email}
              onEmailClear={handleEmailClear}
              onSwitchToPassword={() => setAuthStep(EAdminAuthStep.PASSWORD)}
            />
          )}
        </div>
      </div>
    </>
  );
});
