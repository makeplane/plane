"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
// services
import { AuthService } from "@/services/auth.service";
// ui
import { Button, Checkbox, Input } from "@plane/ui";
// components
import { Banner, PasswordStrengthMeter } from "components/common";
// icons
import { Eye, EyeOff } from "lucide-react";
// helpers
import { API_BASE_URL, cn } from "@/helpers/common.helper";
import { getPasswordStrength } from "@/helpers/password.helper";

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

export const InstanceSignUpForm: FC = (props) => {
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
  const [showPassword, setShowPassword] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState<TFormData>(defaultFromData);

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
      formData.first_name && formData.email && formData.password && getPasswordStrength(formData.password) >= 3
        ? false
        : true,
    [formData]
  );

  return (
    <div className="relative w-full min-h-full h-auto overflow-hidden container mx-auto px-5 lg:px-0 flex justify-center items-center">
      <div className="w-full md:w-4/6 lg:w-3/6 xl:w-2/6 space-y-10">
        <div className="text-center space-y-1">
          <h3 className="text-3xl font-bold">Setup your Plane Instance</h3>
          <p className="font-medium text-custom-text-400">Post setup you will be able to manage this Plane instance.</p>
        </div>

        {errorData.type &&
          errorData?.message &&
          ![EErrorCodes.INVALID_EMAIL, EErrorCodes.INVALID_PASSWORD].includes(errorData.type) && (
            <Banner type="error" message={errorData?.message} />
          )}

        <form className="space-y-4" method="POST" action={`${API_BASE_URL}/api/instances/admins/sign-up/`}>
          <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />

          <div className="flex items-center gap-4">
            <div className="w-full space-y-1">
              <label className="text-sm text-custom-text-300 font-medium" htmlFor="first_name">
                First name <span className="text-red-500">*</span>
              </label>
              <Input
                className="w-full"
                id="first_name"
                name="first_name"
                type="text"
                inputSize="md"
                placeholder="Wilber"
                value={formData.first_name}
                onChange={(e) => handleFormChange("first_name", e.target.value)}
              />
            </div>
            <div className="w-full space-y-1">
              <label className="text-sm text-custom-text-300 font-medium" htmlFor="last_name">
                Last name
              </label>
              <Input
                className="w-full"
                id="last_name"
                name="last_name"
                type="text"
                inputSize="md"
                placeholder="Wright"
                value={formData.last_name}
                onChange={(e) => handleFormChange("last_name", e.target.value)}
              />
            </div>
          </div>

          <div className="w-full space-y-1">
            <label className="text-sm text-custom-text-300 font-medium" htmlFor="email">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              className="w-full"
              id="email"
              name="email"
              type="email"
              inputSize="md"
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
              hasError={errorData.type && errorData.type === EErrorCodes.INVALID_EMAIL ? true : false}
            />
            {errorData.type && errorData.type === EErrorCodes.INVALID_EMAIL && errorData.message && (
              <p className="px-1 text-xs text-red-500">{errorData.message}</p>
            )}
          </div>

          <div className="w-full space-y-1">
            <label className="text-sm text-custom-text-300 font-medium" htmlFor="company_name">
              Company name
            </label>
            <Input
              className="w-full"
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
            <label className="text-sm text-custom-text-300 font-medium" htmlFor="password">
              Set a password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                className={cn("w-full pr-10")}
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                inputSize="md"
                placeholder="New password..."
                value={formData.password}
                onChange={(e) => handleFormChange("password", e.target.value)}
                hasError={errorData.type && errorData.type === EErrorCodes.INVALID_PASSWORD ? true : false}
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
            {errorData.type && errorData.type === EErrorCodes.INVALID_PASSWORD && errorData.message && (
              <p className="px-1 text-xs text-red-500">{errorData.message}</p>
            )}
            <PasswordStrengthMeter password={formData.password} />
          </div>

          <div className="relative flex items-center pt-2 gap-2">
            <Checkbox
              id="is_telemetry_enabled"
              name="is_telemetry_enabled"
              value={formData.is_telemetry_enabled ? "True" : "False"}
              onChange={() => handleFormChange("is_telemetry_enabled", !formData.is_telemetry_enabled)}
              checked={formData.is_telemetry_enabled}
            />
            <label className="text-sm text-custom-text-300 font-medium cursor-pointer" htmlFor="is_telemetry_enabled">
              Allow Plane to anonymously collect usage events.
            </label>
            <a href="#" className="text-sm font-medium text-blue-500 hover:text-blue-600">
              See More
            </a>
          </div>

          <div className="py-2">
            <Button type="submit" size="lg" className="w-full" disabled={isButtonDisabled}>
              Continue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
