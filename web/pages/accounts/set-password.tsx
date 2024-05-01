import { FormEvent, ReactElement, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import Image from "next/image";
import { useRouter } from "next/router";
import useSWR from "swr";
// icons
import { Eye, EyeOff } from "lucide-react";
// ui
import { Button, Input, Spinner, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { PasswordStrengthMeter } from "@/components/account";
import { PageHead } from "@/components/core";
// helpers
import { getPasswordStrength } from "@/helpers/password.helper";
// hooks
import { useUser } from "@/hooks/store";
import useAuthRedirection from "@/hooks/use-auth-redirection";
// layouts
import { UserAuthWrapper } from "@/layouts/auth-layout";
import DefaultLayout from "@/layouts/default-layout";
// lib
import { NextPageWithLayout } from "@/lib/types";
// services
import { AuthService } from "@/services/auth.service";
// images
import PlaneBackgroundPattern from "public/onboarding/background-pattern.svg";
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";

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

const SetPasswordPage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  const { email } = router.query;
  // states
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState<TResetPasswordFormValues>({
    ...defaultValues,
    email: email ? email.toString() : "",
  });
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  const [isPasswordInputFocused, setIsPasswordInputFocused] = useState(false);

  const { data: user, fetchCurrentUser } = useUser();
  // store hooks
  //const { captureEvent } = useEventTracker();
  // sign in redirection hook
  const { isRedirecting, handleRedirection } = useAuthRedirection();

  const { isLoading } = useSWR(`CURRENT_USER_DETAILS`, () => fetchCurrentUser(), {
    shouldRetryOnError: false,
  });

  useEffect(() => {
    if (user && !user?.is_password_autoset) handleRedirection();
  }, [handleRedirection, user?.is_password_autoset]);

  useEffect(() => {
    if (csrfToken === undefined)
      authService.requestCSRFToken().then((data) => data?.csrf_token && setCsrfToken(data.csrf_token));
  }, [csrfToken]);

  const handleFormChange = (key: keyof TResetPasswordFormValues, value: string) =>
    setPasswordFormData((prev) => ({ ...prev, [key]: value }));

  const isButtonDisabled = useMemo(
    () =>
      !!passwordFormData.password &&
      getPasswordStrength(passwordFormData.password) >= 3 &&
      passwordFormData.password === passwordFormData.confirm_password
        ? false
        : true,
    [passwordFormData]
  );

  const handleSetPassword = async (password: string) => {
    if (!csrfToken) throw new Error("csrf token not found");
    await authService.setPassword(csrfToken, { password });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      await handleSetPassword(passwordFormData.password);
      await handleRedirection();
    } catch (err: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: err?.error ?? "Something went wrong. Please try again.",
      });
    }
  };

  if (isRedirecting || isLoading)
    return (
      <div className="grid h-screen place-items-center">
        <Spinner />
      </div>
    );

  return (
    <div className="relative">
      <PageHead title="Reset Password" />
      <div className="absolute inset-0 z-0">
        <Image src={PlaneBackgroundPattern} className="w-screen object-cover" alt="Plane background pattern" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between px-8 pb-4 sm:px-16 sm:py-5 lg:px-28">
          <div className="flex items-center gap-x-2 py-10">
            <Image src={BluePlaneLogoWithoutText} height={30} width={30} alt="Plane Logo" className="mr-2" />
            <span className="text-2xl font-semibold sm:text-3xl">Plane</span>
          </div>
        </div>
        <div className="mx-auto h-full">
          <div className="h-full overflow-auto px-7 pb-56 pt-4 sm:px-0">
            <div className="mx-auto flex flex-col">
              <div className="text-center space-y-1 py-4 mx-auto sm:w-96">
                <h3 className="flex gap-4 justify-center text-3xl font-bold text-onboarding-text-100">
                  Secure your account
                </h3>
                <p className="font-medium text-onboarding-text-400">Setting password helps you login securely</p>
              </div>
              <form className="mx-auto mt-5 space-y-4 w-5/6 sm:w-96" onSubmit={(e) => handleSubmit(e)}>
                <div className="space-y-1">
                  <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="email">
                    Email
                  </label>
                  <div className="relative flex items-center rounded-md bg-onboarding-background-200">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={user?.email}
                      //hasError={Boolean(errors.email)}
                      placeholder="name@company.com"
                      className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 text-onboarding-text-400 cursor-not-allowed"
                      disabled
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="password">
                    Set a password
                  </label>
                  <div className="relative flex items-center rounded-md bg-onboarding-background-200">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={passwordFormData.password}
                      onChange={(e) => handleFormChange("password", e.target.value)}
                      //hasError={Boolean(errors.password)}
                      placeholder="Enter password"
                      className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
                      minLength={8}
                      onFocus={() => setIsPasswordInputFocused(true)}
                      onBlur={() => setIsPasswordInputFocused(false)}
                      autoFocus
                    />
                    {showPassword ? (
                      <EyeOff
                        className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                        onClick={() => setShowPassword(false)}
                      />
                    ) : (
                      <Eye
                        className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                        onClick={() => setShowPassword(true)}
                      />
                    )}
                  </div>
                  {isPasswordInputFocused && <PasswordStrengthMeter password={passwordFormData.password} />}
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="confirm_password">
                    Confirm password
                  </label>
                  <div className="relative flex items-center rounded-md bg-onboarding-background-200">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="confirm_password"
                      value={passwordFormData.confirm_password}
                      onChange={(e) => handleFormChange("confirm_password", e.target.value)}
                      placeholder="Confirm password"
                      className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
                    />
                    {showPassword ? (
                      <EyeOff
                        className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                        onClick={() => setShowPassword(false)}
                      />
                    ) : (
                      <Eye
                        className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                        onClick={() => setShowPassword(true)}
                      />
                    )}
                  </div>
                  {!!passwordFormData.confirm_password &&
                    passwordFormData.password !== passwordFormData.confirm_password && (
                      <span className="text-sm text-red-500">Passwords don{"'"}t match</span>
                    )}
                </div>
                <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isButtonDisabled}>
                  Continue
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

SetPasswordPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <UserAuthWrapper>
      <DefaultLayout>{page}</DefaultLayout>
    </UserAuthWrapper>
  );
};

export default SetPasswordPage;
