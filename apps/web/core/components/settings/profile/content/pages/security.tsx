import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
// plane imports
import { E_PASSWORD_STRENGTH } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Input, PasswordStrengthIndicator } from "@plane/ui";
import { getPasswordStrength } from "@plane/utils";
// components
import { ProfileSettingsHeading } from "@/components/settings/profile/heading";
// helpers
import { authErrorHandler } from "@/helpers/authentication.helper";
import type { EAuthenticationErrorCodes } from "@/helpers/authentication.helper";
// hooks
import { useUser } from "@/hooks/store/user";
// services
import { AuthService } from "@/services/auth.service";

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

const authService = new AuthService();

const defaultShowPassword = {
  oldPassword: false,
  password: false,
  confirmPassword: false,
};

export const SecurityProfileSettings = observer(function SecurityProfileSettings() {
  // store
  const { data: currentUser, changePassword } = useUser();
  // states
  const [showPassword, setShowPassword] = useState(defaultShowPassword);
  const [isPasswordInputFocused, setIsPasswordInputFocused] = useState(false);
  const [isRetryPasswordInputFocused, setIsRetryPasswordInputFocused] = useState(false);

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
  const oldPasswordRequired = !currentUser?.is_password_autoset;
  // i18n
  const { t } = useTranslation();

  const isNewPasswordSameAsOldPassword = oldPassword !== "" && password !== "" && password === oldPassword;

  const handleShowPassword = (key: keyof typeof showPassword) =>
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleChangePassword = async (formData: FormValues) => {
    const { old_password, new_password } = formData;
    try {
      const csrfToken = await authService.requestCSRFToken().then((data) => data?.csrf_token);
      if (!csrfToken) throw new Error("csrf token not found");

      await changePassword(csrfToken, {
        ...(oldPasswordRequired && { old_password }),
        new_password,
      });

      reset(defaultValues);
      setShowPassword(defaultShowPassword);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("auth.common.password.toast.change_password.success.title"),
        message: t("auth.common.password.toast.change_password.success.message"),
      });
    } catch (error: unknown) {
      let errorInfo = undefined;
      if (error instanceof Error) {
        const code = "error_code" in error ? error.error_code?.toString() : undefined;
        errorInfo = code ? authErrorHandler(code as EAuthenticationErrorCodes) : undefined;
      }

      setToast({
        type: TOAST_TYPE.ERROR,
        title: errorInfo?.title ?? t("auth.common.password.toast.error.title"),
        message:
          typeof errorInfo?.message === "string" ? errorInfo.message : t("auth.common.password.toast.error.message"),
      });
    }
  };

  const isButtonDisabled =
    getPasswordStrength(password) != E_PASSWORD_STRENGTH.STRENGTH_VALID ||
    (oldPasswordRequired && oldPassword.trim() === "") ||
    password.trim() === "" ||
    confirmPassword.trim() === "" ||
    password !== confirmPassword ||
    password === oldPassword;

  const passwordSupport = password.length > 0 &&
    getPasswordStrength(password) != E_PASSWORD_STRENGTH.STRENGTH_VALID && (
      <PasswordStrengthIndicator password={password} isFocused={isPasswordInputFocused} />
    );

  const renderPasswordMatchError = !isRetryPasswordInputFocused || confirmPassword.length >= password.length;

  return (
    <div className="size-full">
      <ProfileSettingsHeading title={t("auth.common.password.change_password.label.default")} />
      <form onSubmit={handleSubmit(handleChangePassword)} className="mt-7 flex flex-col gap-8">
        <div className="flex flex-col gap-y-7">
          {oldPasswordRequired && (
            <div className="flex flex-col gap-y-2">
              <h4 className="text-13">{t("auth.common.password.current_password.label")}</h4>
              <div className="relative flex items-center rounded-md">
                <Controller
                  control={control}
                  name="old_password"
                  rules={{
                    required: t("common.errors.required"),
                  }}
                  render={({ field: { value, onChange } }) => (
                    <Input
                      id="old_password"
                      type={showPassword?.oldPassword ? "text" : "password"}
                      value={value}
                      onChange={onChange}
                      placeholder={t("old_password")}
                      className="w-full"
                      hasError={Boolean(errors.old_password)}
                    />
                  )}
                />
                {showPassword?.oldPassword ? (
                  <EyeOff
                    className="absolute right-3 h-5 w-5 stroke-placeholder hover:cursor-pointer"
                    onClick={() => handleShowPassword("oldPassword")}
                  />
                ) : (
                  <Eye
                    className="absolute right-3 h-5 w-5 stroke-placeholder hover:cursor-pointer"
                    onClick={() => handleShowPassword("oldPassword")}
                  />
                )}
              </div>
              {errors.old_password && (
                <span className="text-11 text-danger-primary">{errors.old_password.message}</span>
              )}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-y-7 gap-x-4">
            <div className="flex flex-col gap-y-2">
              <h4 className="text-13">{t("auth.common.password.new_password.label")}</h4>
              <div className="relative flex items-center rounded-md">
                <Controller
                  control={control}
                  name="new_password"
                  rules={{
                    required: t("common.errors.required"),
                  }}
                  render={({ field: { value, onChange } }) => (
                    <Input
                      id="new_password"
                      type={showPassword?.password ? "text" : "password"}
                      value={value}
                      placeholder={t("auth.common.password.new_password.placeholder")}
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
                    className="absolute right-3 h-5 w-5 stroke-placeholder hover:cursor-pointer"
                    onClick={() => handleShowPassword("password")}
                  />
                ) : (
                  <Eye
                    className="absolute right-3 h-5 w-5 stroke-placeholder hover:cursor-pointer"
                    onClick={() => handleShowPassword("password")}
                  />
                )}
              </div>
              {passwordSupport}
              {isNewPasswordSameAsOldPassword && !isPasswordInputFocused && (
                <span className="text-11 text-danger-primary">
                  {t("new_password_must_be_different_from_old_password")}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-y-2">
              <h4 className="text-13">{t("auth.common.password.confirm_password.label")}</h4>
              <div className="relative flex items-center rounded-md">
                <Controller
                  control={control}
                  name="confirm_password"
                  rules={{
                    required: t("common.errors.required"),
                  }}
                  render={({ field: { value, onChange } }) => (
                    <Input
                      id="confirm_password"
                      type={showPassword?.confirmPassword ? "text" : "password"}
                      placeholder={t("auth.common.password.confirm_password.placeholder")}
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
                    className="absolute right-3 h-5 w-5 stroke-placeholder hover:cursor-pointer"
                    onClick={() => handleShowPassword("confirmPassword")}
                  />
                ) : (
                  <Eye
                    className="absolute right-3 h-5 w-5 stroke-placeholder hover:cursor-pointer"
                    onClick={() => handleShowPassword("confirmPassword")}
                  />
                )}
              </div>
              {!!confirmPassword && password !== confirmPassword && renderPasswordMatchError && (
                <span className="text-13 text-danger-primary">{t("auth.common.password.errors.match")}</span>
              )}
            </div>
          </div>
          <div>
            <Button variant="primary" size="xl" type="submit" loading={isSubmitting} disabled={isButtonDisabled}>
              {isSubmitting
                ? `${t("auth.common.password.change_password.label.submitting")}`
                : t("auth.common.password.change_password.label.default")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
});
