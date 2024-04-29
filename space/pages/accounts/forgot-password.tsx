import { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import { Controller, useForm } from "react-hook-form";
// icons
import { CircleCheck } from "lucide-react";
// ui
import { Button, Input, TOAST_TYPE, getButtonStyling, setToast } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
import { checkEmailValidity } from "@/helpers/string.helper";
// hooks
// import useAuthRedirection from "@/hooks/use-auth-redirection";
import useTimer from "@/hooks/use-timer";
// services
import { AuthService } from "@/services/authentication.service";
// images
import PlaneBackgroundPatternDark from "public/onboarding/background-pattern-dark.svg";
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

const ForgotPasswordPage: NextPage = () => {
  // router
  const router = useRouter();
  const { email } = router.query;
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
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Email sent",
          message:
            "Check your inbox for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.",
        });
        setResendCodeTimer(30);
      })
      .catch((err: any) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        });
      });
  };

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


export default ForgotPasswordPage;
