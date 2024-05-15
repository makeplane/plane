import { ReactElement, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { Controller, useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
// ui
import { Button, Input, Spinner, TOAST_TYPE, setPromiseToast, setToast } from "@plane/ui";
// components
import { PasswordStrengthMeter } from "@/components/account";
import { PageHead } from "@/components/core";
import { SidebarHamburgerToggle } from "@/components/core/sidebar";
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

const ChangePasswordPage: NextPageWithLayout = observer(() => {
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    password: false,
    retypePassword: false,
  });
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

  const oldPassword = watch("old_password");
  const password = watch("new_password");
  const retypePassword = watch("confirm_password");

  const handleShowPassword = (key: keyof typeof showPassword) =>
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleChangePassword = async (formData: FormValues) => {
    try {
      if (!csrfToken) throw new Error("csrf token not found");
      const changePasswordPromise = userService
        .changePassword(csrfToken, {
          old_password: formData.old_password,
          new_password: formData.new_password,
        })
        .then(() => {
          reset(defaultValues);
        });
      setPromiseToast(changePasswordPromise, {
        loading: "Changing password...",
        success: {
          title: "Success!",
          message: () => "Password changed successfully.",
        },
        error: {
          title: "Error!",
          message: () => "Something went wrong. Please try again 1.",
        },
      });
    } catch (err: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: err?.error ?? "Something went wrong. Please try again 2.",
      });
    }
  };

  useEffect(() => {
    if (csrfToken === undefined)
      authService.requestCSRFToken().then((data) => data?.csrf_token && setCsrfToken(data.csrf_token));
  }, [csrfToken]);

  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.is_password_autoset) router.push("/profile");
    else setIsPageLoading(false);
  }, [currentUser, router]);

  const isButtonDisabled = useMemo(
    () =>
      !isSubmitting &&
      !!oldPassword &&
      !!password &&
      !!retypePassword &&
      getPasswordStrength(password) >= 3 &&
      password === retypePassword &&
      password !== oldPassword
        ? false
        : true,

    [isSubmitting, oldPassword, password, retypePassword]
  );

  const passwordSupport = password.length > 0 && (getPasswordStrength(password) < 3 || isPasswordInputFocused) && (
    <PasswordStrengthMeter password={password} />
  );

  if (isPageLoading)
    return (
      <div className="grid h-screen w-full place-items-center">
        <Spinner />
      </div>
    );

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
          <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />

          <h3 className="text-xl font-medium">Change password</h3>
          <div className="flex flex-col gap-10 w-full max-w-96">
            <div className="flex flex-col gap-1 ">
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
                      className="w-full rounded-md font-medium"
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

            <div className="flex flex-col gap-1 ">
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
            </div>

            <div className="flex flex-col gap-1 ">
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
                      type={showPassword?.retypePassword ? "text" : "password"}
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
                {showPassword?.retypePassword ? (
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
              {!!retypePassword && password !== retypePassword && !isRetryPasswordInputFocused && (
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
