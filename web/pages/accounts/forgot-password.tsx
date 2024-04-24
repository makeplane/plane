import { ReactElement, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { Controller, useForm } from "react-hook-form";
// icons
import { CircleCheck } from "lucide-react";
// ui
import { Button, Input, Spinner, TOAST_TYPE, getButtonStyling, setToast } from "@plane/ui";
// components
import { PageHead } from "@/components/core";
// constants
import { FORGOT_PASS_LINK, NAVIGATE_TO_SIGNUP } from "@/constants/event-tracker";
// helpers
import { cn } from "@/helpers/common.helper";
import { checkEmailValidity } from "@/helpers/string.helper";
// hooks
import { useEventTracker } from "@/hooks/store";
import useAuthRedirection from "@/hooks/use-auth-redirection";
import useTimer from "@/hooks/use-timer";
// layouts
import DefaultLayout from "@/layouts/default-layout";
// lib
import { NextPageWithLayout } from "@/lib/types";
// services
import { AuthService } from "@/services/auth.service";
// images
import PlaneBackgroundPattern from "public/onboarding/background-pattern.svg";
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";

type TForgotPasswordFormValues = {
  email: string;
};

const defaultValues: TForgotPasswordFormValues = {
  email: "",
};

// services
const authService = new AuthService();

const ForgotPasswordPage: NextPageWithLayout = () => {
  // router
  const router = useRouter();
  const { email } = router.query;
  // store hooks
  const { captureEvent } = useEventTracker();
  // timer
  const { timer: resendTimerCode, setTimer: setResendCodeTimer } = useTimer(0);
  const { isRedirecting, handleRedirection } = useAuthRedirection();

  useEffect(() => {
    handleRedirection();
  }, [handleRedirection]);
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
          title: "Email sent",
          message:
            "Check your inbox for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.",
        });
        setResendCodeTimer(30);
      })
      .catch((err) => {
        captureEvent(FORGOT_PASS_LINK, {
          state: "FAILED",
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        });
      });
  };

  if (isRedirecting)
    return (
      <div className="grid h-screen place-items-center">
        <Spinner />
      </div>
    );

  return (
    <div className="relative">
      <PageHead title="Forgot Password" />
      <div className="absolute inset-0 z-0">
        <Image src={PlaneBackgroundPattern} className="w-screen object-cover" alt="Plane background pattern" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between px-8 pb-4 sm:px-16 sm:py-5 lg:px-28">
          <div className="flex items-center gap-x-2 py-10">
            <Image src={BluePlaneLogoWithoutText} height={30} width={30} alt="Plane Logo" className="mr-2" />
            <span className="text-2xl font-semibold sm:text-3xl">Plane</span>
          </div>
          <div className="text-center text-sm font-medium text-onboarding-text-300">
            New to Plane?{" "}
            <Link
              href="/accounts/sign-up"
              onClick={() => captureEvent(NAVIGATE_TO_SIGNUP, {})}
              className="font-semibold text-custom-primary-100 hover:underline"
            >
              Create an account
            </Link>
          </div>
        </div>
        <div className="mx-auto h-full">
          <div className="h-full overflow-auto px-7 pb-56 pt-4 sm:px-0">
            <div className="mx-auto flex flex-col">
              <div className="text-center space-y-1 py-4 mx-auto sm:w-96">
                <h3 className="flex gap-4 justify-center text-3xl font-bold text-onboarding-text-100">
                  Reset your password
                </h3>
                <p className="font-medium text-onboarding-text-400">
                  Enter your user account{"'"}s verified email address and we will send you a password reset link.
                </p>
              </div>
              <form onSubmit={handleSubmit(handleForgotPassword)} className="mx-auto mt-5 space-y-4 w-5/6 sm:w-96">
                <div className="space-y-1">
                  <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="email">
                    Email
                  </label>
                  <Controller
                    control={control}
                    name="email"
                    rules={{
                      required: "Email is required",
                      validate: (value) => checkEmailValidity(value) || "Email is invalid",
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
                        placeholder="name@company.com"
                        className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
                        disabled={resendTimerCode > 0}
                      />
                    )}
                  />
                  {resendTimerCode > 0 && (
                    <p className="flex w-full items-start px-1 gap-1 text-xs font-medium text-green-700">
                      <CircleCheck height={12} width={12} className="mt-0.5" />
                      We sent the reset link to your email address
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
                  {resendTimerCode > 0 ? `Resend in ${resendTimerCode} seconds` : "Send reset link"}
                </Button>
                <Link href="/" className={cn("w-full", getButtonStyling("link-neutral", "lg"))}>
                  Back to sign in
                </Link>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ForgotPasswordPage.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};

export default ForgotPasswordPage;
