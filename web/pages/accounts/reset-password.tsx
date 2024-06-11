import { ReactElement, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
// icons
import { useTheme } from "next-themes";
import { Eye, EyeOff } from "lucide-react";
// ui
import { Button, Input } from "@plane/ui";
// components
import { AuthBanner, PasswordStrengthMeter } from "@/components/account";
import { PageHead } from "@/components/core";
// helpers
import {
  EAuthenticationErrorCodes,
  EErrorAlertType,
  EPageTypes,
  TAuthErrorInfo,
  authErrorHandler,
} from "@/helpers/authentication.helper";
import { API_BASE_URL } from "@/helpers/common.helper";
import { getPasswordStrength } from "@/helpers/password.helper";
// layouts
import DefaultLayout from "@/layouts/default-layout";
// lib
import { NextPageWithLayout } from "@/lib/types";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers";
// services
import { AuthService } from "@/services/auth.service";
// images
import PlaneBackgroundPatternDark from "public/auth/background-pattern-dark.svg";
import PlaneBackgroundPattern from "public/auth/background-pattern.svg";
import BlackHorizontalLogo from "public/plane-logos/black-horizontal-with-blue-logo.png";
import WhiteHorizontalLogo from "public/plane-logos/white-horizontal-with-blue-logo.png";

type TResetPasswordFormValues = {
  email: string;
  password: string;
  confirm_password?: string;
};

const defaultValues: TResetPasswordFormValues = {
  email: "",
  password: "",
};

// services
const authService = new AuthService();

const ResetPasswordPage: NextPageWithLayout = () => {
  // router
  const router = useRouter();
  const { uidb64, token, email, error_code } = router.query;
  // states
  const [showPassword, setShowPassword] = useState({
    password: false,
    retypePassword: false,
  });
  const [resetFormData, setResetFormData] = useState<TResetPasswordFormValues>({
    ...defaultValues,
    email: email ? email.toString() : "",
  });
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  const [isPasswordInputFocused, setIsPasswordInputFocused] = useState(false);
  const [isRetryPasswordInputFocused, setIsRetryPasswordInputFocused] = useState(false);
  const [errorInfo, setErrorInfo] = useState<TAuthErrorInfo | undefined>(undefined);

  // hooks
  const { resolvedTheme } = useTheme();

  const handleShowPassword = (key: keyof typeof showPassword) =>
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleFormChange = (key: keyof TResetPasswordFormValues, value: string) =>
    setResetFormData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (csrfToken === undefined)
      authService.requestCSRFToken().then((data) => data?.csrf_token && setCsrfToken(data.csrf_token));
  }, [csrfToken]);

  const isButtonDisabled = useMemo(
    () =>
      !!resetFormData.password &&
      getPasswordStrength(resetFormData.password) >= 3 &&
      resetFormData.password === resetFormData.confirm_password
        ? false
        : true,
    [resetFormData]
  );

  useEffect(() => {
    if (error_code) {
      const errorhandler = authErrorHandler(error_code?.toString() as EAuthenticationErrorCodes);
      if (errorhandler) {
        setErrorInfo(errorhandler);
      }
    }
  }, [error_code]);

  const password = resetFormData?.password ?? "";
  const confirmPassword = resetFormData?.confirm_password ?? "";
  const renderPasswordMatchError = !isRetryPasswordInputFocused || confirmPassword.length >= password.length;

  const logo = resolvedTheme === "light" ? BlackHorizontalLogo : WhiteHorizontalLogo;

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <PageHead title="Reset Password - Plane" />
      <div className="absolute inset-0 z-0">
        <Image
          src={resolvedTheme === "dark" ? PlaneBackgroundPatternDark : PlaneBackgroundPattern}
          className="w-full h-full object-cover"
          alt="Plane background pattern"
        />
      </div>
      <div className="relative z-10 w-screen h-screen overflow-hidden overflow-y-auto flex flex-col">
        <div className="container mx-auto px-10 lg:px-0 flex-shrink-0 relative flex items-center justify-between pb-4 transition-all">
          <div className="flex items-center gap-x-2 py-10">
            <Link href={`/`} className="h-[30px] w-[133px]">
              <Image src={logo} alt="Plane logo" />
            </Link>
          </div>
        </div>
        <div className="flex-grow container mx-auto max-w-lg px-10 lg:max-w-md lg:px-5 py-10 lg:pt-28 transition-all">
          <div className="relative flex flex-col space-y-6">
            <div className="text-center space-y-1 py-4">
              <h3 className="flex gap-4 justify-center text-3xl font-bold text-onboarding-text-100">
                Set new password
              </h3>
              <p className="font-medium text-onboarding-text-400">Secure your account with a strong password</p>
            </div>
            {errorInfo && errorInfo?.type === EErrorAlertType.BANNER_ALERT && (
              <AuthBanner bannerData={errorInfo} handleBannerData={(value) => setErrorInfo(value)} />
            )}
            <form
              className="mt-5 space-y-4"
              method="POST"
              action={`${API_BASE_URL}/auth/reset-password/${uidb64?.toString()}/${token?.toString()}/`}
            >
              <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
              <div className="space-y-1">
                <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="email">
                  Email
                </label>
                <div className="relative flex items-center rounded-md bg-onboarding-background-200">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={resetFormData.email}
                    //hasError={Boolean(errors.email)}
                    placeholder="name@company.com"
                    className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 text-onboarding-text-400 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="password">
                  Password
                </label>
                <div className="relative flex items-center rounded-md bg-onboarding-background-200">
                  <Input
                    type={showPassword.password ? "text" : "password"}
                    name="password"
                    value={resetFormData.password}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    //hasError={Boolean(errors.password)}
                    placeholder="Enter password"
                    className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
                    minLength={8}
                    onFocus={() => setIsPasswordInputFocused(true)}
                    onBlur={() => setIsPasswordInputFocused(false)}
                    autoFocus
                  />
                  {showPassword.password ? (
                    <EyeOff
                      className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                      onClick={() => handleShowPassword("password")}
                    />
                  ) : (
                    <Eye
                      className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                      onClick={() => handleShowPassword("password")}
                    />
                  )}
                </div>
                {isPasswordInputFocused && <PasswordStrengthMeter password={resetFormData.password} />}
              </div>
              <div className="space-y-1">
                <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="confirm_password">
                  Confirm password
                </label>
                <div className="relative flex items-center rounded-md bg-onboarding-background-200">
                  <Input
                    type={showPassword.retypePassword ? "text" : "password"}
                    name="confirm_password"
                    value={resetFormData.confirm_password}
                    onChange={(e) => handleFormChange("confirm_password", e.target.value)}
                    placeholder="Confirm password"
                    className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
                    onFocus={() => setIsRetryPasswordInputFocused(true)}
                    onBlur={() => setIsRetryPasswordInputFocused(false)}
                  />
                  {showPassword.retypePassword ? (
                    <EyeOff
                      className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                      onClick={() => handleShowPassword("retypePassword")}
                    />
                  ) : (
                    <Eye
                      className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                      onClick={() => handleShowPassword("retypePassword")}
                    />
                  )}
                </div>
                {!!resetFormData.confirm_password &&
                  resetFormData.password !== resetFormData.confirm_password &&
                  renderPasswordMatchError && <span className="text-sm text-red-500">Passwords don{"'"}t match</span>}
              </div>
              <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isButtonDisabled}>
                Set password
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

ResetPasswordPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <DefaultLayout>
      <AuthenticationWrapper pageType={EPageTypes.NON_AUTHENTICATED}>{page}</AuthenticationWrapper>
    </DefaultLayout>
  );
};

export default ResetPasswordPage;
