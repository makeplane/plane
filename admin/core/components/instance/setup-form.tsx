"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
// icons
import { Eye, EyeOff } from "lucide-react";
// ui
import { Button, Checkbox, Input, Spinner } from "@plane/ui";
// components
import { Banner, PasswordStrengthMeter } from "@/components/common";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
import { E_PASSWORD_STRENGTH, getPasswordStrength } from "@/helpers/password.helper";
// services
import { AuthService } from "@/services/auth.service";

// service initialization
const authService = new AuthService();

// error codes
enum EErrorCodes {
  INSTANCE_NOT_CONFIGURED = "INSTANCE_NOT_CONFIGURED",
  ADMIN_ALREADY_EXIST = "ADMIN_ALREADY_EXIST",
  REQUIRED_EMAIL_PASSWORD_FIRST_NAME = "REQUIRED_EMAIL_PASSWORD_FIRST_NAME",
  INVALID_EMAIL = "INVALID_EMAIL",
  INVALID_PASSWORD = "INVALID_PASSWORD",
  USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",
}

type TError = {
  type: EErrorCodes | undefined;
  message: string | undefined;
};

// form data
type TFormData = {
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
  password: string;
  confirm_password?: string;
  is_telemetry_enabled: boolean;
};

const defaultFromData: TFormData = {
  first_name: "",
  last_name: "",
  email: "",
  company_name: "",
  password: "",
  is_telemetry_enabled: true,
};

export const InstanceSetupForm: FC = (props) => {
  const {} = props;
  // search params
  const searchParams = useSearchParams();
  const firstNameParam = searchParams.get("first_name") || undefined;
  const lastNameParam = searchParams.get("last_name") || undefined;
  const companyParam = searchParams.get("company") || undefined;
  const emailParam = searchParams.get("email") || undefined;
  const isTelemetryEnabledParam = (searchParams.get("is_telemetry_enabled") === "True" ? true : false) || true;
  const errorCode = searchParams.get("error_code") || undefined;
  const errorMessage = searchParams.get("error_message") || undefined;
  // state
  const [showPassword, setShowPassword] = useState({
    password: false,
    retypePassword: false,
  });
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState<TFormData>(defaultFromData);
  const [isPasswordInputFocused, setIsPasswordInputFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetryPasswordInputFocused, setIsRetryPasswordInputFocused] = useState(false);

  const handleShowPassword = (key: keyof typeof showPassword) =>
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleFormChange = (key: keyof TFormData, value: string | boolean) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (csrfToken === undefined)
      authService.requestCSRFToken().then((data) => data?.csrf_token && setCsrfToken(data.csrf_token));
  }, [csrfToken]);

  useEffect(() => {
    if (firstNameParam) setFormData((prev) => ({ ...prev, first_name: firstNameParam }));
    if (lastNameParam) setFormData((prev) => ({ ...prev, last_name: lastNameParam }));
    if (companyParam) setFormData((prev) => ({ ...prev, company_name: companyParam }));
    if (emailParam) setFormData((prev) => ({ ...prev, email: emailParam }));
    if (isTelemetryEnabledParam) setFormData((prev) => ({ ...prev, is_telemetry_enabled: isTelemetryEnabledParam }));
  }, [firstNameParam, lastNameParam, companyParam, emailParam, isTelemetryEnabledParam]);

  // derived values
  const errorData: TError = useMemo(() => {
    if (errorCode && errorMessage) {
      switch (errorCode) {
        case EErrorCodes.INSTANCE_NOT_CONFIGURED:
          return { type: EErrorCodes.INSTANCE_NOT_CONFIGURED, message: errorMessage };
        case EErrorCodes.ADMIN_ALREADY_EXIST:
          return { type: EErrorCodes.ADMIN_ALREADY_EXIST, message: errorMessage };
        case EErrorCodes.REQUIRED_EMAIL_PASSWORD_FIRST_NAME:
          return { type: EErrorCodes.REQUIRED_EMAIL_PASSWORD_FIRST_NAME, message: errorMessage };
        case EErrorCodes.INVALID_EMAIL:
          return { type: EErrorCodes.INVALID_EMAIL, message: errorMessage };
        case EErrorCodes.INVALID_PASSWORD:
          return { type: EErrorCodes.INVALID_PASSWORD, message: errorMessage };
        case EErrorCodes.USER_ALREADY_EXISTS:
          return { type: EErrorCodes.USER_ALREADY_EXISTS, message: errorMessage };
        default:
          return { type: undefined, message: undefined };
      }
    } else return { type: undefined, message: undefined };
  }, [errorCode, errorMessage]);

  const isButtonDisabled = useMemo(
    () =>
      !isSubmitting &&
      formData.first_name &&
      formData.email &&
      formData.password &&
      getPasswordStrength(formData.password) === E_PASSWORD_STRENGTH.STRENGTH_VALID &&
      formData.password === formData.confirm_password
        ? false
        : true,
    [formData.confirm_password, formData.email, formData.first_name, formData.password, isSubmitting]
  );

  const password = formData?.password ?? "";
  const confirmPassword = formData?.confirm_password ?? "";
  const renderPasswordMatchError = !isRetryPasswordInputFocused || confirmPassword.length >= password.length;

  return (
    <div className="max-w-lg lg:max-w-md w-full">
      <div className="relative flex flex-col space-y-6">
        <div className="text-center space-y-1">
          <h3 className="flex gap-4 justify-center text-3xl font-bold text-onboarding-text-100">
            Setup your Plane Instance
          </h3>
          <p className="font-medium text-onboarding-text-400">
            Post setup you will be able to manage this Plane instance.
          </p>
        </div>

        {errorData.type &&
          errorData?.message &&
          ![EErrorCodes.INVALID_EMAIL, EErrorCodes.INVALID_PASSWORD].includes(errorData.type) && (
            <Banner type="error" message={errorData?.message} />
          )}

        <form
          className="space-y-4"
          method="POST"
          action={`${API_BASE_URL}/api/instances/admins/sign-up/`}
          onSubmit={() => setIsSubmitting(true)}
          onError={() => setIsSubmitting(false)}
        >
          <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
          <input type="hidden" name="is_telemetry_enabled" value={formData.is_telemetry_enabled ? "True" : "False"} />

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full space-y-1">
              <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="first_name">
                First name <span className="text-red-500">*</span>
              </label>
              <Input
                className="w-full border border-onboarding-border-100 !bg-onboarding-background-200 placeholder:text-onboarding-text-400"
                id="first_name"
                name="first_name"
                type="text"
                inputSize="md"
                placeholder="Wilber"
                value={formData.first_name}
                onChange={(e) => handleFormChange("first_name", e.target.value)}
                autoComplete="on"
                autoFocus
              />
            </div>
            <div className="w-full space-y-1">
              <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="last_name">
                Last name <span className="text-red-500">*</span>
              </label>
              <Input
                className="w-full border border-onboarding-border-100 !bg-onboarding-background-200 placeholder:text-onboarding-text-400"
                id="last_name"
                name="last_name"
                type="text"
                inputSize="md"
                placeholder="Wright"
                value={formData.last_name}
                onChange={(e) => handleFormChange("last_name", e.target.value)}
                autoComplete="on"
              />
            </div>
          </div>

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
              hasError={errorData.type && errorData.type === EErrorCodes.INVALID_EMAIL ? true : false}
              autoComplete="on"
            />
            {errorData.type && errorData.type === EErrorCodes.INVALID_EMAIL && errorData.message && (
              <p className="px-1 text-xs text-red-500">{errorData.message}</p>
            )}
          </div>

          <div className="w-full space-y-1">
            <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="company_name">
              Company name <span className="text-red-500">*</span>
            </label>
            <Input
              className="w-full border border-onboarding-border-100 !bg-onboarding-background-200 placeholder:text-onboarding-text-400"
              id="company_name"
              name="company_name"
              type="text"
              inputSize="md"
              placeholder="Company name"
              value={formData.company_name}
              onChange={(e) => handleFormChange("company_name", e.target.value)}
            />
          </div>

          <div className="w-full space-y-1">
            <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="password">
              Set a password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                className="w-full border border-onboarding-border-100 !bg-onboarding-background-200 placeholder:text-onboarding-text-400"
                id="password"
                name="password"
                type={showPassword.password ? "text" : "password"}
                inputSize="md"
                placeholder="New password..."
                value={formData.password}
                onChange={(e) => handleFormChange("password", e.target.value)}
                hasError={errorData.type && errorData.type === EErrorCodes.INVALID_PASSWORD ? true : false}
                onFocus={() => setIsPasswordInputFocused(true)}
                onBlur={() => setIsPasswordInputFocused(false)}
                autoComplete="on"
              />
              {showPassword.password ? (
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-3.5 flex items-center justify-center text-custom-text-400"
                  onClick={() => handleShowPassword("password")}
                >
                  <EyeOff className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-3.5 flex items-center justify-center text-custom-text-400"
                  onClick={() => handleShowPassword("password")}
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
            </div>
            {errorData.type && errorData.type === EErrorCodes.INVALID_PASSWORD && errorData.message && (
              <p className="px-1 text-xs text-red-500">{errorData.message}</p>
            )}
            <PasswordStrengthMeter password={formData.password} isFocused={isPasswordInputFocused} />
          </div>

          <div className="w-full space-y-1">
            <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="confirm_password">
              Confirm password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showPassword.retypePassword ? "text" : "password"}
                id="confirm_password"
                name="confirm_password"
                inputSize="md"
                value={formData.confirm_password}
                onChange={(e) => handleFormChange("confirm_password", e.target.value)}
                placeholder="Confirm password"
                className="w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
                onFocus={() => setIsRetryPasswordInputFocused(true)}
                onBlur={() => setIsRetryPasswordInputFocused(false)}
              />
              {showPassword.retypePassword ? (
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-3.5 flex items-center justify-center text-custom-text-400"
                  onClick={() => handleShowPassword("retypePassword")}
                >
                  <EyeOff className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-3.5 flex items-center justify-center text-custom-text-400"
                  onClick={() => handleShowPassword("retypePassword")}
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
            </div>
            {!!formData.confirm_password &&
              formData.password !== formData.confirm_password &&
              renderPasswordMatchError && <span className="text-sm text-red-500">Passwords don{"'"}t match</span>}
          </div>

          <div className="relative flex items-center pt-2 gap-2">
            <div>
              <Checkbox
                className="w-4 h-4"
                iconClassName="w-3 h-3"
                id="is_telemetry_enabled"
                onChange={() => handleFormChange("is_telemetry_enabled", !formData.is_telemetry_enabled)}
                checked={formData.is_telemetry_enabled}
              />
            </div>
            <label
              className="text-sm text-onboarding-text-300 font-medium cursor-pointer"
              htmlFor="is_telemetry_enabled"
            >
              Allow Plane to anonymously collect usage events.
            </label>
            <a
              tabIndex={-1}
              href="https://docs.plane.so/telemetry"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-500 hover:text-blue-600"
            >
              See More
            </a>
          </div>

          <div className="py-2">
            <Button type="submit" size="lg" className="w-full" disabled={isButtonDisabled}>
              {isSubmitting ? <Spinner height="20px" width="20px" /> : "Continue"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
