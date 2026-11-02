/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { HideOutline, ShowOutline } from "@makeplane/propel/icons";
// plane imports
import { Field } from "@makeplane/propel/components/field";
import { FieldLabel, FieldError } from "@makeplane/propel/elements/field";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { E_PASSWORD_STRENGTH } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { setToast } from "@plane/blocks/toast";
import { PasswordStrengthIndicator } from "@plane/blocks/auth";
import { getPasswordStrength } from "@plane/utils";
// components
import { ProfileSettingsHeading } from "@/components/settings/profile/heading";
// helpers
import { authErrorHandler, EAuthenticationErrorCodes, passwordErrors } from "@/helpers/authentication.helper";
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
    setError,
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
        type: "success",
        title: t("auth.common.password.toast.change_password.success.title"),
        message: t("auth.common.password.toast.change_password.success.message"),
      });
    } catch (error: unknown) {
      const err = error as Error & { error_code?: string };
      const code = err.error_code?.toString();
      const errorInfo = code ? authErrorHandler(code as EAuthenticationErrorCodes) : undefined;

      setToast({
        type: "error",
        title: errorInfo?.title ?? t("auth.common.password.toast.change_password.error.title"),
        message:
          typeof errorInfo?.message === "string"
            ? errorInfo.message
            : t("auth.common.password.toast.change_password.error.message"),
      });

      if (code && passwordErrors.includes(code as EAuthenticationErrorCodes)) {
        setError("new_password", {
          type: "manual",
          message: errorInfo?.message?.toString() || t("auth.common.password.toast.change_password.error.message"),
        });
      }
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
              <FieldLabel size="2xl" inset={false} htmlFor="old_password">
                {t("auth.common.password.current_password.label")}
              </FieldLabel>
              <Controller
                control={control}
                name="old_password"
                rules={{
                  required: t("common.errors.required"),
                }}
                render={({ field: { value, onChange } }) => (
                  <Field name="old_password" invalid={Boolean(errors.old_password)}>
                    <InputGroup size="2xl">
                      <Input
                        size="2xl"
                        id="old_password"
                        aria-describedby={errors.old_password ? "security-old-password-error" : undefined}
                        type={showPassword?.oldPassword ? "text" : "password"}
                        value={value}
                        onChange={onChange}
                        placeholder={t("old_password")}
                        autoComplete="current-password"
                      />
                      <IconButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        showTooltip={false}
                        onClick={() => handleShowPassword("oldPassword")}
                        aria-label={t(
                          showPassword?.oldPassword
                            ? "aria_labels.auth_forms.hide_password"
                            : "aria_labels.auth_forms.show_password"
                        )}
                        icon={
                          showPassword?.oldPassword ? (
                            <HideOutline className="size-5 text-placeholder" />
                          ) : (
                            <ShowOutline className="size-5 text-placeholder" />
                          )
                        }
                      />
                    </InputGroup>
                  </Field>
                )}
              />
              {errors.old_password && (
                <FieldError size="lg" id="security-old-password-error">
                  {errors.old_password.message}
                </FieldError>
              )}
            </div>
          )}
          <div className="grid gap-x-4 gap-y-7 sm:grid-cols-2">
            <div className="flex flex-col gap-y-2">
              <FieldLabel size="2xl" inset={false} htmlFor="new_password">
                {t("auth.common.password.new_password.label")}
              </FieldLabel>
              <Controller
                control={control}
                name="new_password"
                rules={{
                  required: t("common.errors.required"),
                }}
                render={({ field: { value, onChange } }) => (
                  <Field name="new_password" invalid={Boolean(errors.new_password)}>
                    <InputGroup size="2xl">
                      <Input
                        size="2xl"
                        id="new_password"
                        aria-invalid={
                          Boolean(errors.new_password) ||
                          (isNewPasswordSameAsOldPassword && !isPasswordInputFocused) ||
                          undefined
                        }
                        aria-describedby={
                          [
                            passwordSupport && "security-new-password-support",
                            errors.new_password && "security-new-password-error",
                            isNewPasswordSameAsOldPassword &&
                              !isPasswordInputFocused &&
                              "security-new-password-same-error",
                          ]
                            .filter(Boolean)
                            .join(" ") || undefined
                        }
                        type={showPassword?.password ? "text" : "password"}
                        value={value}
                        placeholder={t("auth.common.password.new_password.placeholder")}
                        onChange={onChange}
                        onFocus={() => setIsPasswordInputFocused(true)}
                        onBlur={() => setIsPasswordInputFocused(false)}
                        autoComplete="new-password"
                      />
                      <IconButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        showTooltip={false}
                        onClick={() => handleShowPassword("password")}
                        aria-label={t(
                          showPassword?.password
                            ? "aria_labels.auth_forms.hide_password"
                            : "aria_labels.auth_forms.show_password"
                        )}
                        icon={
                          showPassword?.password ? (
                            <HideOutline className="size-5 text-placeholder" />
                          ) : (
                            <ShowOutline className="size-5 text-placeholder" />
                          )
                        }
                      />
                    </InputGroup>
                  </Field>
                )}
              />
              {passwordSupport && <div id="security-new-password-support">{passwordSupport}</div>}
              {errors.new_password && (
                <FieldError size="lg" id="security-new-password-error">
                  {errors.new_password.message}
                </FieldError>
              )}
              {isNewPasswordSameAsOldPassword && !isPasswordInputFocused && (
                <FieldError size="lg" id="security-new-password-same-error">
                  {t("new_password_must_be_different_from_old_password")}
                </FieldError>
              )}
            </div>
            <div className="flex flex-col gap-y-2">
              <FieldLabel size="2xl" inset={false} htmlFor="confirm_password">
                {t("auth.common.password.confirm_password.label")}
              </FieldLabel>
              <Controller
                control={control}
                name="confirm_password"
                rules={{
                  required: t("common.errors.required"),
                }}
                render={({ field: { value, onChange } }) => (
                  <Field name="confirm_password" invalid={Boolean(errors.confirm_password)}>
                    <InputGroup size="2xl">
                      <Input
                        size="2xl"
                        id="confirm_password"
                        aria-invalid={
                          Boolean(errors.confirm_password) ||
                          (!!confirmPassword && password !== confirmPassword && renderPasswordMatchError) ||
                          undefined
                        }
                        aria-describedby={
                          !!confirmPassword && password !== confirmPassword && renderPasswordMatchError
                            ? "security-password-match-error"
                            : undefined
                        }
                        type={showPassword?.confirmPassword ? "text" : "password"}
                        placeholder={t("auth.common.password.confirm_password.placeholder")}
                        value={value}
                        onChange={onChange}
                        onFocus={() => setIsRetryPasswordInputFocused(true)}
                        onBlur={() => setIsRetryPasswordInputFocused(false)}
                        autoComplete="new-password"
                      />
                      <IconButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        showTooltip={false}
                        onClick={() => handleShowPassword("confirmPassword")}
                        aria-label={t(
                          showPassword?.confirmPassword
                            ? "aria_labels.auth_forms.hide_password"
                            : "aria_labels.auth_forms.show_password"
                        )}
                        icon={
                          showPassword?.confirmPassword ? (
                            <HideOutline className="size-5 text-placeholder" />
                          ) : (
                            <ShowOutline className="size-5 text-placeholder" />
                          )
                        }
                      />
                    </InputGroup>
                  </Field>
                )}
              />
              {!!confirmPassword && password !== confirmPassword && renderPasswordMatchError && (
                <FieldError size="lg" id="security-password-match-error">
                  {t("auth.common.password.errors.match")}
                </FieldError>
              )}
            </div>
          </div>
          <div>
            <Button
              variant="primary"
              size="lg"
              stretch="auto"
              type="submit"
              label={
                isSubmitting
                  ? `${t("auth.common.password.change_password.label.submitting")}`
                  : t("auth.common.password.change_password.label.default")
              }
              loading={isSubmitting}
              disabled={isButtonDisabled}
            />
          </div>
        </div>
      </form>
    </div>
  );
});
