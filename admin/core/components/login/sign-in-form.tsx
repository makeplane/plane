"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
// services
import { Eye, EyeOff } from "lucide-react";
import { Button, Input, Spinner } from "@plane/ui";
// components
import { Banner } from "@/components/common";
// helpers
import {
  authErrorHandler,
  EAuthenticationErrorCodes,
  EErrorAlertType,
  TAuthErrorInfo,
} from "@/helpers/authentication.helper";

import { API_BASE_URL } from "@/helpers/common.helper";
import { AuthService } from "@/services/auth.service";
import { AuthBanner } from "../authentication";
// ui
// icons

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

export const InstanceSignInForm: FC = (props) => {
  const {} = props;
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
  const [errorInfo, setErrorInfo] = useState<TAuthErrorInfo | undefined>(undefined);

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
          return { type: EErrorCodes.INVALID_EMAIL, message: errorMessage };
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
      const errorDetail = authErrorHandler(errorCode?.toString() as EAuthenticationErrorCodes);
      if (errorDetail) {
        setErrorInfo(errorDetail);
      }
    }
  }, [errorCode]);

  return (
    <div className="flex-grow container mx-auto max-w-lg px-10 lg:max-w-md lg:px-5 py-10 lg:pt-28 transition-all">
      <div className="relative flex flex-col space-y-6">
        <div className="text-center space-y-1">
          <h3 className="flex gap-4 justify-center text-3xl font-bold text-onboarding-text-100">
            Manage your Plane instance
          </h3>
          <p className="font-medium text-onboarding-text-400">
            Configure instance-wide settings to secure your instance
          </p>
        </div>

        {errorData.type && errorData?.message ? (
          <Banner type="error" message={errorData?.message} />
        ) : (
          <>{errorInfo && <AuthBanner bannerData={errorInfo} handleBannerData={(value) => setErrorInfo(value)} />}</>
        )}

        <form
          className="space-y-4"
          method="POST"
          action={`${API_BASE_URL}/api/instances/admins/sign-in/`}
          onSubmit={() => setIsSubmitting(true)}
          onError={() => setIsSubmitting(false)}
        >
          <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />

          <div className="w-full space-y-1">
            <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="email">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              className="w-full border border-onboarding-border-100 !bg-onboarding-background-200 placeholder:text-onboarding-text-400"
              id="email"
              name="email"
              type="email"
              inputSize="md"
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
              autoComplete="on"
              autoFocus
            />
          </div>

          <div className="w-full space-y-1">
            <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="password">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                className="w-full border border-onboarding-border-100 !bg-onboarding-background-200 placeholder:text-onboarding-text-400"
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                inputSize="md"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleFormChange("password", e.target.value)}
                autoComplete="on"
              />
              {showPassword ? (
                <button
                  type="button"
                  className="absolute right-3 top-3.5 flex items-center justify-center text-custom-text-400"
                  onClick={() => setShowPassword(false)}
                >
                  <EyeOff className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  className="absolute right-3 top-3.5 flex items-center justify-center text-custom-text-400"
                  onClick={() => setShowPassword(true)}
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="py-2">
            <Button type="submit" size="lg" className="w-full" disabled={isButtonDisabled}>
              {isSubmitting ? <Spinner height="20px" width="20px" /> : "Sign in"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
