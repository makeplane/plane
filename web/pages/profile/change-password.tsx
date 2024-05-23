import { ReactElement, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { Controller, useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
// ui
import { Button, Input, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { PasswordStrengthMeter } from "@/components/account";
import { LogoSpinner } from "@/components/common";
import { PageHead } from "@/components/core";
import { SidebarHamburgerToggle } from "@/components/core/sidebar";
// helpers
import { authErrorHandler } from "@/helpers/authentication.helper";
import { getPasswordStrength } from "@/helpers/password.helper";
// hooks
import { useAppTheme, useUser } from "@/hooks/store";
// layout
import { ProfileSettingsLayout } from "@/layouts/settings-layout";
// types
import { NextPageWithLayout } from "@/lib/types";
// services
import { AuthService } from "@/services/auth.service";
import { UserService } from "@/services/user.service";

export interface FormValues {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

const defaultValues: FormValues = {
  old_password: "",
  new_password: "",
  confirm_password: "",
};

export const userService = new UserService();
export const authService = new AuthService();

const defaultShowPassword = {
  oldPassword: false,
  password: false,
  confirmPassword: false,
};

const ChangePasswordPage: NextPageWithLayout = observer(() => {
  // states
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(defaultShowPassword);
  const [isPasswordInputFocused, setIsPasswordInputFocused] = useState(false);
  const [isRetryPasswordInputFocused, setIsRetryPasswordInputFocused] = useState(false);
  // router
  const router = useRouter();
  // store hooks
  const { toggleSidebar } = useAppTheme();
  const { data: currentUser } = useUser();
  // use form
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({ defaultValues });
  // derived values
  const oldPassword = watch("old_password");
  const password = watch("new_password");
  const confirmPassword = watch("confirm_password");

  const isNewPasswordSameAsOldPassword = oldPassword !== "" && password !== "" && password === oldPassword;

  const handleShowPassword = (key: keyof typeof showPassword) =>
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleChangePassword = async (formData: FormValues) => {
    const { old_password, new_password } = formData;
    try {
      const csrfToken = await authService.requestCSRFToken().then((data) => data?.csrf_token);
      if (!csrfToken) throw new Error("csrf token not found");

      await userService.changePassword(csrfToken, {
        old_password,
        new_password,
      });

      reset(defaultValues);
      setShowPassword(defaultShowPassword);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Password changed successfully.",
      });
    } catch (err: any) {
      const errorInfo = authErrorHandler(err.error_code?.toString());
      setToast({
        type: TOAST_TYPE.ERROR,
        title: errorInfo?.title ?? "Error!",
        message:
          typeof errorInfo?.message === "string" ? errorInfo.message : "Something went wrong. Please try again 2.",
      });
    }
  };

  // if the user doesn't have a password set, redirect to the profile page
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.is_password_autoset) router.push("/profile");
    else setIsPageLoading(false);
  }, [currentUser, router]);

  const isButtonDisabled =
    getPasswordStrength(password) < 3 ||
    oldPassword.trim() === "" ||
    password.trim() === "" ||
    confirmPassword.trim() === "" ||
    password !== confirmPassword ||
    password === oldPassword;

  const passwordSupport = password.length > 0 && (getPasswordStrength(password) < 3 || isPasswordInputFocused) && (
    <PasswordStrengthMeter password={password} />
  );

  if (isPageLoading)
    return (
      <div className="grid h-screen w-full place-items-center">
        <LogoSpinner />
      </div>
    );

  const renderPasswordMatchError = !isRetryPasswordInputFocused || confirmPassword.length >= password.length;

  return (
    <>
      <PageHead title="Profile - Change Password" />
      <div className="flex h-full flex-col">
        <div className="block flex-shrink-0 border-b border-custom-border-200 p-4 md:hidden">
          <SidebarHamburgerToggle onClick={() => toggleSidebar()} />
        </div>
        <form
          onSubmit={handleSubmit(handleChangePassword)}
          className="mx-auto md:mt-16 mt-10 flex h-full w-full flex-col gap-8 px-4 md:px-8 pb-8 lg:w-3/5"
        >
          <h3 className="text-xl font-medium">Change password</h3>
          <div className="flex flex-col gap-10 w-full max-w-96">
            <div className="space-y-1">
              <h4 className="text-sm">Current password</h4>
              <div className="relative flex items-center rounded-md">
                <Controller
                  control={control}
                  name="old_password"
                  rules={{
                    required: "This field is required",
                  }}
                  render={({ field: { value, onChange } }) => (
                    <Input
                      id="old_password"
                      type={showPassword?.oldPassword ? "text" : "password"}
                      value={value}
                      onChange={onChange}
                      placeholder="Old password"
                      className="w-full"
                      hasError={Boolean(errors.old_password)}
                    />
                  )}
                />
                {showPassword?.oldPassword ? (
                  <EyeOff
                    className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                    onClick={() => handleShowPassword("oldPassword")}
                  />
                ) : (
                  <Eye
                    className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                    onClick={() => handleShowPassword("oldPassword")}
                  />
                )}
              </div>
              {errors.old_password && <span className="text-xs text-red-500">{errors.old_password.message}</span>}
            </div>
            <div className="space-y-1">
              <h4 className="text-sm">New password</h4>
              <div className="relative flex items-center rounded-md">
                <Controller
                  control={control}
                  name="new_password"
                  rules={{
                    required: "This field is required",
                  }}
                  render={({ field: { value, onChange } }) => (
                    <Input
                      id="new_password"
                      type={showPassword?.password ? "text" : "password"}
                      value={value}
                      placeholder="New password"
                      onChange={onChange}
                      className="w-full"
                      hasError={Boolean(errors.new_password)}
                      onFocus={() => setIsPasswordInputFocused(true)}
                      onBlur={() => setIsPasswordInputFocused(false)}
                    />
                  )}
                />
                {showPassword?.password ? (
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
              {passwordSupport}
              {isNewPasswordSameAsOldPassword && !isPasswordInputFocused && (
                <span className="text-xs text-red-500">New password must be different from old password</span>
              )}
            </div>
            <div className="space-y-1">
              <h4 className="text-sm">Confirm password</h4>
              <div className="relative flex items-center rounded-md">
                <Controller
                  control={control}
                  name="confirm_password"
                  rules={{
                    required: "This field is required",
                  }}
                  render={({ field: { value, onChange } }) => (
                    <Input
                      id="confirm_password"
                      type={showPassword?.confirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={value}
                      onChange={onChange}
                      className="w-full"
                      hasError={Boolean(errors.confirm_password)}
                      onFocus={() => setIsRetryPasswordInputFocused(true)}
                      onBlur={() => setIsRetryPasswordInputFocused(false)}
                    />
                  )}
                />
                {showPassword?.confirmPassword ? (
                  <EyeOff
                    className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                    onClick={() => handleShowPassword("confirmPassword")}
                  />
                ) : (
                  <Eye
                    className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                    onClick={() => handleShowPassword("confirmPassword")}
                  />
                )}
              </div>
              {!!confirmPassword && password !== confirmPassword && renderPasswordMatchError && (
                <span className="text-sm text-red-500">Passwords don{"'"}t match</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <Button variant="primary" type="submit" loading={isSubmitting} disabled={isButtonDisabled}>
              {isSubmitting ? "Changing password..." : "Change password"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
});

ChangePasswordPage.getLayout = function getLayout(page: ReactElement) {
  return <ProfileSettingsLayout>{page}</ProfileSettingsLayout>;
};

export default ChangePasswordPage;
