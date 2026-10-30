/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HideOutline, ShowOutline } from "@makeplane/propel/icons";
// plane internal packages
import type { EAdminAuthErrorCodes, TAdminAuthErrorInfo } from "@plane/constants";
import { API_BASE_URL } from "@plane/constants";
import { Button } from "@makeplane/propel/components/button";
import { InputField } from "@makeplane/propel/components/input-field";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Banner } from "@makeplane/propel/components/banner";
import { AuthService } from "@plane/services";
// local components
import { FormHeader } from "@/components/instance/form-header";
import { AuthBanner } from "./auth-banner";
import { AuthHeader } from "./auth-header";
import { authErrorHandler } from "./auth-helpers";

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

// form data
type TFormData = {
  email: string;
  password: string;
};

const defaultFromData: TFormData = {
  email: "",
  password: "",
};

export function InstanceSignInForm() {
  // search params
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || undefined;
  const errorCode = searchParams.get("error_code") || undefined;
  const errorMessage = searchParams.get("error_message") || undefined;
  // state
  const [showPassword, setShowPassword] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState<TFormData>(defaultFromData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorInfo, setErrorInfo] = useState<TAdminAuthErrorInfo | undefined>(undefined);

  const handleFormChange = (key: keyof TFormData, value: string | boolean) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (csrfToken === undefined)
      authService.requestCSRFToken().then((data) => data?.csrf_token && setCsrfToken(data.csrf_token));
  }, [csrfToken]);

  useEffect(() => {
    if (emailParam) setFormData((prev) => ({ ...prev, email: emailParam }));
  }, [emailParam]);

  // derived values
  const errorData: TError = useMemo(() => {
    if (errorCode && errorMessage) {
      switch (errorCode) {
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

  const isButtonDisabled = useMemo(
    () => (!isSubmitting && formData.email && formData.password ? false : true),
    [formData.email, formData.password, isSubmitting]
  );

  useEffect(() => {
    if (errorCode) {
      const errorDetail = authErrorHandler(errorCode?.toString() as EAdminAuthErrorCodes);
      if (errorDetail) {
        setErrorInfo(errorDetail);
      }
    }
  }, [errorCode]);

  return (
    <>
      <AuthHeader />
      <div className="mt-10 flex w-full flex-grow flex-col items-center justify-center py-6">
        <div className="relative flex w-full max-w-[22.5rem] flex-col gap-6">
          <FormHeader
            heading="Manage your Plane instance"
            subHeading="Configure instance-wide settings to secure your instance"
          />
          <form
            className="space-y-4"
            method="POST"
            action={`${API_BASE_URL}/api/instances/admins/sign-in/`}
            onSubmit={() => setIsSubmitting(true)}
            onError={() => setIsSubmitting(false)}
          >
            {errorData.type && errorData?.message ? (
              <Banner placement="inline" variant="danger" description={errorData?.message} />
            ) : (
              <>{errorInfo && <AuthBanner bannerData={errorInfo} handleBannerData={setErrorInfo} />}</>
            )}
            <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />

            <InputField
              size="lg"
              id="email"
              name="email"
              type="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
              autoComplete="off"
              autoFocus
              orientation="vertical"
              label="Email"
              required
            />

            <InputField
              size="lg"
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleFormChange("password", e.target.value)}
              autoComplete="off"
              orientation="vertical"
              label="Password"
              required
              endIcon={
                <IconButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  icon={<Icon icon={showPassword ? HideOutline : ShowOutline} />}
                  onClick={() => setShowPassword((visible) => !visible)}
                />
              }
            />
            <div className="py-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                stretch="full"
                disabled={isButtonDisabled}
                loading={isSubmitting}
                label="Sign in"
              />
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
