"use client";

import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Controller, useForm } from "react-hook-form";
// icons
import { CircleCheck } from "lucide-react";
// plane imports
import { FORGOT_PASS_LINK, NAVIGATE_TO_SIGNUP } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button, Input, TOAST_TYPE, getButtonStyling, setToast } from "@plane/ui";
// helpers
import { EPageTypes } from "@/helpers/authentication.helper";
import { cn } from "@/helpers/common.helper";
import { checkEmailValidity } from "@/helpers/string.helper";
// hooks
import { useEventTracker } from "@/hooks/store";
import useTimer from "@/hooks/use-timer";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers";
// images
import PlaneBackgroundPatternDark from "@/public/auth/background-pattern-dark.svg";
import PlaneBackgroundPattern from "@/public/auth/background-pattern.svg";
import BlackHorizontalLogo from "@/public/plane-logos/black-horizontal-with-blue-logo.png";
import WhiteHorizontalLogo from "@/public/plane-logos/white-horizontal-with-blue-logo.png";
// services
import { AuthService } from "@/services/auth.service";

type TForgotPasswordFormValues = {
  email: string;
};

const defaultValues: TForgotPasswordFormValues = {
  email: "",
};

// services
const authService = new AuthService();

const ForgotPasswordPage = observer(() => {
  // search params
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { captureEvent } = useEventTracker();
  // hooks
  const { resolvedTheme } = useTheme();
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
        captureEvent(FORGOT_PASS_LINK, {
          state: "SUCCESS",
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("auth.forgot_password.toast.success.title"),
          message: t("auth.forgot_password.toast.success.message"),
        });
        setResendCodeTimer(30);
      })
      .catch((err) => {
        captureEvent(FORGOT_PASS_LINK, {
          state: "FAILED",
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("auth.forgot_password.toast.error.title"),
          message: err?.error ?? t("auth.forgot_password.toast.error.message"),
        });
      });
  };

  const logo = resolvedTheme === "light" ? BlackHorizontalLogo : WhiteHorizontalLogo;

  return (
    <AuthenticationWrapper pageType={EPageTypes.NON_AUTHENTICATED}>
      <div className="relative w-screen h-screen overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={resolvedTheme === "dark" ? PlaneBackgroundPatternDark : PlaneBackgroundPattern}
            className="w-full h-full object-cover"
            alt="Plane background pattern"
          />
        </div>
        <div className="relative z-10 w-screen h-screen overflow-hidden overflow-y-auto flex flex-col">
          <div className="container min-w-full px-10 lg:px-20 xl:px-36 flex-shrink-0 relative flex items-center justify-between pb-4 transition-all">
            <div className="flex items-center gap-x-2 py-10">
              <Link href={`/`} className="h-[30px] w-[133px]">
                <Image src={logo} alt="Plane logo" />
              </Link>
            </div>
            <div className="flex flex-col items-end sm:items-center sm:gap-2 sm:flex-row text-center text-sm font-medium text-onboarding-text-300">
              {t("auth.common.new_to_plane")}
              <Link
                href="/"
                onClick={() => captureEvent(NAVIGATE_TO_SIGNUP, {})}
                className="font-semibold text-custom-primary-100 hover:underline"
              >
                {t("auth.common.create_account")}
              </Link>
            </div>
          </div>
          <div className="flex-grow container mx-auto max-w-lg px-10 lg:max-w-md lg:px-5 py-10 lg:pt-28 transition-all">
            <div className="relative flex flex-col space-y-6">
              <div className="text-center space-y-1 py-4">
                <h3 className="flex gap-4 justify-center text-3xl font-bold text-onboarding-text-100">
                  {t("auth.forgot_password.title")}
                </h3>
                <p className="font-medium text-onboarding-text-400">{t("auth.forgot_password.description")}</p>
              </div>
              <form onSubmit={handleSubmit(handleForgotPassword)} className="mt-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="email">
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
                        className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
                        autoComplete="on"
                        disabled={resendTimerCode > 0}
                      />
                    )}
                  />
                  {resendTimerCode > 0 && (
                    <p className="flex w-full items-start px-1 gap-1 text-xs font-medium text-green-700">
                      <CircleCheck height={12} width={12} className="mt-0.5" />
                      {t("auth.forgot_password.email_sent")}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  size="lg"
                  disabled={!isValid}
                  loading={isSubmitting || resendTimerCode > 0}
                >
                  {resendTimerCode > 0
                    ? t("auth.common.resend_in", { seconds: resendTimerCode })
                    : t("auth.forgot_password.send_reset_link")}
                </Button>
                <Link href="/" className={cn("w-full", getButtonStyling("link-neutral", "lg"))}>
                  {t("auth.common.back_to_sign_in")}
                </Link>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AuthenticationWrapper>
  );
});

export default ForgotPasswordPage;
