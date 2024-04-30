import { useEffect, useMemo, useState } from "react";
import { NextPage } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
// icons
import { useTheme } from "next-themes";
import { Eye, EyeOff } from "lucide-react";
// ui
import { Button, Input } from "@plane/ui";
// components
import { PasswordStrengthMeter } from "@/components/accounts";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
import { getPasswordStrength } from "@/helpers/password.helper";
// hooks
// services
import { AuthService } from "@/services/authentication.service";
// images
import PlaneBackgroundPatternDark from "public/onboarding/background-pattern-dark.svg";
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

const ResetPasswordPage: NextPage = () => {
  // router
  const router = useRouter();
  const { uidb64, token, email } = router.query;
  // states
  const [showPassword, setShowPassword] = useState(false);
  const [resetFormData, setResetFormData] = useState<TResetPasswordFormValues>({
    ...defaultValues,
    email: email ? email.toString() : "",
  });
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  const [isPasswordInputFocused, setIsPasswordInputFocused] = useState(false);
  // hooks
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (email && !resetFormData.email) {
      setResetFormData((prev) => ({ ...prev, email: email.toString() }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

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

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src={resolvedTheme === "dark" ? PlaneBackgroundPatternDark : PlaneBackgroundPattern}
          className="w-screen min-h-screen object-cover"
          alt="Plane background pattern"
        />
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
                  Set new password
                </h3>
                <p className="font-medium text-onboarding-text-400">Secure your account with a strong password</p>
              </div>
              <form
                className="mx-auto mt-5 space-y-4 w-5/6 sm:w-96"
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
                      type={showPassword ? "text" : "password"}
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
                  {isPasswordInputFocused && <PasswordStrengthMeter password={resetFormData.password} />}
                </div>
                {getPasswordStrength(resetFormData.password) >= 3 && (
                  <div className="space-y-1">
                    <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="confirm_password">
                      Confirm password
                    </label>
                    <div className="relative flex items-center rounded-md bg-onboarding-background-200">
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="confirm_password"
                        value={resetFormData.confirm_password}
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
                    {!!resetFormData.confirm_password && resetFormData.password !== resetFormData.confirm_password && (
                      <span className="text-sm text-red-500">Password doesn{"'"}t match</span>
                    )}
                  </div>
                )}
                <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isButtonDisabled}>
                  Set password
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
