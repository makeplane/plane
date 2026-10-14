/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
// icons
import { HideOutline, ShowOutline } from "@makeplane/propel/icons";
// plane internal packages
import { API_BASE_URL, E_PASSWORD_STRENGTH } from "@plane/constants";
import { Button } from "@makeplane/propel/components/button";
import { Checkbox } from "@makeplane/propel/components/checkbox";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { AuthService } from "@plane/services";
import { getPasswordStrength, validatePersonName, validateCompanyName } from "@plane/utils";
// components
import { AuthHeader } from "@/app/(all)/(home)/auth-header";
import { PasswordStrengthIndicator } from "@/components/common/password-strength-indicator";
import { Banner } from "../common/banner";
import { FormHeader } from "./form-header";

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

export function InstanceSetupForm() {
  // search params
  const searchParams = useSearchParams();
  const firstNameParam = searchParams?.get("first_name") || undefined;
  const lastNameParam = searchParams?.get("last_name") || undefined;
  const companyParam = searchParams?.get("company") || undefined;
  const emailParam = searchParams?.get("email") || undefined;
  const isTelemetryEnabledParam = (searchParams?.get("is_telemetry_enabled") === "True" ? true : false) || true;
  const errorCode = searchParams?.get("error_code") || undefined;
  const errorMessage = searchParams?.get("error_message") || undefined;
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
    <>
      <AuthHeader />
      <div className="mt-10 flex w-full flex-grow flex-col items-center justify-center py-6">
        <div className="relative flex w-full max-w-[22.5rem] flex-col gap-6">
          <FormHeader
            heading="Setup your Plane Instance"
            subHeading="Post setup you will be able to manage this Plane instance."
          />
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

            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="w-full space-y-1">
                <label className="text-13 font-medium text-tertiary" htmlFor="first_name">
                  First name <span className="text-danger-primary">*</span>
                </label>
                <InputGroup size="lg">
                  <Input
                    size="lg"
                    id="first_name"
                    name="first_name"
                    type="text"
                    placeholder="Wilber"
                    value={formData.first_name}
                    onChange={(e) => {
                      const validation = validatePersonName(e.target.value);
                      if (validation === true || e.target.value === "") {
                        handleFormChange("first_name", e.target.value);
                      }
                    }}
                    autoComplete="off"
                    autoFocus
                    maxLength={50}
                  />
                </InputGroup>
              </div>
              <div className="w-full space-y-1">
                <label className="text-13 font-medium text-tertiary" htmlFor="last_name">
                  Last name <span className="text-danger-primary">*</span>
                </label>
                <InputGroup size="lg">
                  <Input
                    size="lg"
                    id="last_name"
                    name="last_name"
                    type="text"
                    placeholder="Wright"
                    value={formData.last_name}
                    onChange={(e) => {
                      const validation = validatePersonName(e.target.value);
                      if (validation === true || e.target.value === "") {
                        handleFormChange("last_name", e.target.value);
                      }
                    }}
                    autoComplete="off"
                    maxLength={50}
                  />
                </InputGroup>
              </div>
            </div>

            <div className="w-full space-y-1">
              <label className="text-13 font-medium text-tertiary" htmlFor="email">
                Email <span className="text-danger-primary">*</span>
              </label>
              <InputGroup size="lg">
                <Input
                  size="lg"
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => handleFormChange("email", e.target.value)}
                  aria-invalid={errorData.type && errorData.type === EErrorCodes.INVALID_EMAIL ? true : false}
                  autoComplete="off"
                />
              </InputGroup>
              {errorData.type && errorData.type === EErrorCodes.INVALID_EMAIL && errorData.message && (
                <p className="px-1 text-11 text-danger-primary">{errorData.message}</p>
              )}
            </div>

            <div className="w-full space-y-1">
              <label className="text-13 font-medium text-tertiary" htmlFor="company_name">
                Company name <span className="text-danger-primary">*</span>
              </label>
              <InputGroup size="lg">
                <Input
                  size="lg"
                  id="company_name"
                  name="company_name"
                  type="text"
                  placeholder="Company name"
                  value={formData.company_name}
                  onChange={(e) => {
                    const validation = validateCompanyName(e.target.value, false);
                    if (validation === true || e.target.value === "") {
                      handleFormChange("company_name", e.target.value);
                    }
                  }}
                  maxLength={80}
                />
              </InputGroup>
            </div>

            <div className="w-full space-y-1">
              <label className="text-13 font-medium text-tertiary" htmlFor="password">
                Set a password <span className="text-danger-primary">*</span>
              </label>
              <InputGroup size="lg">
                <Input
                  size="lg"
                  id="password"
                  name="password"
                  type={showPassword.password ? "text" : "password"}
                  placeholder="New password"
                  value={formData.password}
                  onChange={(e) => handleFormChange("password", e.target.value)}
                  aria-invalid={errorData.type && errorData.type === EErrorCodes.INVALID_PASSWORD ? true : false}
                  onFocus={() => setIsPasswordInputFocused(true)}
                  onBlur={() => setIsPasswordInputFocused(false)}
                  autoComplete="new-password"
                />
                {showPassword.password ? (
                  <button
                    type="button"
                    aria-label="Hide password"
                    className="flex items-center justify-center text-placeholder"
                    onClick={() => handleShowPassword("password")}
                  >
                    <HideOutline className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label="Show password"
                    className="flex items-center justify-center text-placeholder"
                    onClick={() => handleShowPassword("password")}
                  >
                    <ShowOutline className="h-4 w-4" />
                  </button>
                )}
              </InputGroup>
              {errorData.type && errorData.type === EErrorCodes.INVALID_PASSWORD && errorData.message && (
                <p className="px-1 text-11 text-danger-primary">{errorData.message}</p>
              )}
              <PasswordStrengthIndicator password={formData.password} isFocused={isPasswordInputFocused} />
            </div>

            <div className="w-full space-y-1">
              <label className="text-13 font-medium text-tertiary" htmlFor="confirm_password">
                Confirm password <span className="text-danger-primary">*</span>
              </label>
              <InputGroup size="lg">
                <Input
                  size="lg"
                  type={showPassword.retypePassword ? "text" : "password"}
                  id="confirm_password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={(e) => handleFormChange("confirm_password", e.target.value)}
                  placeholder="Confirm password"
                  onFocus={() => setIsRetryPasswordInputFocused(true)}
                  onBlur={() => setIsRetryPasswordInputFocused(false)}
                  autoComplete="new-password"
                />
                {showPassword.retypePassword ? (
                  <button
                    type="button"
                    aria-label="Hide password"
                    className="flex items-center justify-center text-placeholder"
                    onClick={() => handleShowPassword("retypePassword")}
                  >
                    <HideOutline className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label="Show password"
                    className="flex items-center justify-center text-placeholder"
                    onClick={() => handleShowPassword("retypePassword")}
                  >
                    <ShowOutline className="h-4 w-4" />
                  </button>
                )}
              </InputGroup>
              {!!formData.confirm_password &&
                formData.password !== formData.confirm_password &&
                renderPasswordMatchError && (
                  <span className="text-13 text-danger-primary">Passwords don{"'"}t match</span>
                )}
            </div>

            <div className="relative flex gap-2">
              <div>
                <Checkbox
                  id="is_telemetry_enabled"
                  aria-label="Allow Plane to anonymously collect usage events"
                  onCheckedChange={(checked) => handleFormChange("is_telemetry_enabled", checked)}
                  checked={formData.is_telemetry_enabled}
                />
              </div>
              <label className="cursor-pointer text-13 font-medium text-tertiary" htmlFor="is_telemetry_enabled">
                Allow Plane to anonymously collect usage events.{" "}
                <a
                  href="https://developers.plane.so/self-hosting/telemetry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 flex-shrink-0 text-13 font-medium"
                >
                  See More
                </a>
              </label>
            </div>

            <div className="py-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                stretch="full"
                disabled={isButtonDisabled}
                loading={isSubmitting}
                label="Continue"
              />
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
