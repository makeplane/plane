import { observer } from "mobx-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
// icons
import { CircleCheck } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button, getButtonStyling } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Input } from "@plane/ui";
import { cn, checkEmailValidity } from "@plane/utils";
// hooks
import useTimer from "@/hooks/use-timer";
// services
import { AuthService } from "@/services/auth.service";
// local components
import { FormContainer } from "./common/container";
import { AuthFormHeader } from "./common/header";

type TForgotPasswordFormValues = {
  email: string;
};

const defaultValues: TForgotPasswordFormValues = {
  email: "",
};

// services
const authService = new AuthService();

export const ForgotPasswordForm = observer(function ForgotPasswordForm() {
  // search params
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  // plane hooks
  const { t } = useTranslation();
  // timer
  const { timer: resendTimerCode, setTimer: setResendCodeTimer } = useTimer(0);

  // form info
  const {
    control,
    formState: { errors, isSubmitting, isValid },
    handleSubmit,
  } = useForm<TForgotPasswordFormValues>({
    defaultValues: {
      ...defaultValues,
      email: email?.toString() ?? "",
    },
  });

  const handleForgotPassword = async (formData: TForgotPasswordFormValues) => {
    await authService
      .sendResetPasswordLink({
        email: formData.email,
      })
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("auth.forgot_password.toast.success.title"),
          message: t("auth.forgot_password.toast.success.message"),
        });
        setResendCodeTimer(30);
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("auth.forgot_password.toast.error.title"),
          message: err?.error ?? t("auth.forgot_password.toast.error.message"),
        });
      });
  };

  return (
    <FormContainer>
      <AuthFormHeader title="Reset password" description="Regain access to your account." />
      <form onSubmit={handleSubmit(handleForgotPassword)} className="space-y-4">
        <div className="space-y-1">
          <label className="text-13 font-medium text-tertiary" htmlFor="email">
            {t("auth.common.email.label")}
          </label>
          <Controller
            control={control}
            name="email"
            rules={{
              required: t("auth.common.email.errors.required"),
              validate: (value) => checkEmailValidity(value) || t("auth.common.email.errors.invalid"),
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="email"
                name="email"
                type="email"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.email)}
                placeholder={t("auth.common.email.placeholder")}
                className="h-10 w-full border border-strong !bg-surface-1 pr-12 placeholder:text-placeholder"
                autoComplete="on"
                disabled={resendTimerCode > 0}
              />
            )}
          />
          {resendTimerCode > 0 && (
            <p className="flex items-start w-full gap-1 px-1 text-11 font-medium text-success-primary">
              <CircleCheck height={12} width={12} className="mt-0.5" />
              {t("auth.forgot_password.email_sent")}
            </p>
          )}
        </div>
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          size="xl"
          disabled={!isValid}
          loading={isSubmitting || resendTimerCode > 0}
        >
          {resendTimerCode > 0
            ? t("auth.common.resend_in", { seconds: resendTimerCode })
            : t("auth.forgot_password.send_reset_link")}
        </Button>
        <Link href="/" className={cn("w-full", getButtonStyling("link", "lg"))}>
          {t("auth.common.back_to_sign_in")}
        </Link>
      </form>
    </FormContainer>
  );
});
