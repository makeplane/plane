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
import { AUTH_TRACKER_ELEMENTS, AUTH_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button, Input, TOAST_TYPE, getButtonStyling, setToast } from "@plane/ui";
import { cn, checkEmailValidity } from "@plane/utils";
// helpers
import { EPageTypes } from "@/helpers/authentication.helper";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useInstance } from "@/hooks/store";
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
  const { config } = useInstance();
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
        captureSuccess({
          eventName: AUTH_TRACKER_EVENTS.forgot_password,
          payload: {
            email: formData.email,
          },
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("auth.forgot_password.toast.success.title"),
          message: t("auth.forgot_password.toast.success.message"),
        });
        setResendCodeTimer(30);
      })
      .catch((err) => {
        captureError({
          eventName: AUTH_TRACKER_EVENTS.forgot_password,
          payload: {
            email: formData.email,
          },
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("auth.forgot_password.toast.error.title"),
          message: err?.error ?? t("auth.forgot_password.toast.error.message"),
        });
      });
  };

  // derived values
  const enableSignUpConfig = config?.enable_signup ?? false;

  const logo = resolvedTheme === "light" ? BlackHorizontalLogo : WhiteHorizontalLogo;

  return (
    <AuthenticationWrapper pageType={EPageTypes.NON_AUTHENTICATED}>
      <div className="relative w-screen h-screen overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={resolvedTheme === "dark" ? PlaneBackgroundPatternDark : PlaneBackgroundPattern}
            className="object-cover w-full h-full"
            alt="Plane background pattern"
          />
        </div>
        <div className="relative z-10 flex flex-col w-screen h-screen overflow-hidden overflow-y-auto">
          <div className="container relative flex items-center justify-between flex-shrink-0 min-w-full px-10 pb-4 transition-all lg:px-20 xl:px-36">
            <div className="flex items-center py-10 gap-x-2">
              <Link href={`/`} className="h-[30px] w-[133px]">
                <Image src={logo} alt="Plane logo" />
              </Link>
            </div>
            {enableSignUpConfig && (
              <div className="flex flex-col items-end text-sm font-medium text-center sm:items-center sm:gap-2 sm:flex-row text-onboarding-text-300">
                {t("auth.common.new_to_plane")}
                <Link
                  href="/"
                  data-ph-element={AUTH_TRACKER_ELEMENTS.SIGNUP_FROM_FORGOT_PASSWORD}
                  className="font-semibold text-custom-primary-100 hover:underline"
                >
                  {t("auth.common.create_account")}
                </Link>
              </div>
            )}
          </div>
          <div className="container flex-grow max-w-lg px-10 py-10 mx-auto transition-all lg:max-w-md lg:px-5 lg:pt-28">
            <div className="relative flex flex-col space-y-6">
              <div className="py-4 space-y-1 text-center">
                <h3 className="flex justify-center gap-4 text-3xl font-bold text-onboarding-text-100">
                  {t("auth.forgot_password.title")}
                </h3>
                <p className="font-medium text-onboarding-text-400">{t("auth.forgot_password.description")}</p>
              </div>
              <form onSubmit={handleSubmit(handleForgotPassword)} className="mt-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-onboarding-text-300" htmlFor="email">
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
                    <p className="flex items-start w-full gap-1 px-1 text-xs font-medium text-green-700">
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
