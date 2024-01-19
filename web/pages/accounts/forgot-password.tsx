import { ReactElement } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { Controller, useForm } from "react-hook-form";
// services
import { AuthService } from "services/auth.service";
// hooks
import useToast from "hooks/use-toast";
import useTimer from "hooks/use-timer";
// layouts
import DefaultLayout from "layouts/default-layout";
// components
import { LatestFeatureBlock } from "components/common";
// ui
import { Button, Input } from "@plane/ui";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";
// helpers
import { checkEmailValidity } from "helpers/string.helper";
// type
import { NextPageWithLayout } from "lib/types";

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
  // toast
  const { setToastAlert } = useToast();
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
        setToastAlert({
          type: "success",
          title: "Email sent",
          message:
            "Check your inbox for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.",
        });
        setResendCodeTimer(30);
      })
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        })
      );
  };

  return (
    <div className="h-full w-full bg-onboarding-gradient-100">
      <div className="flex items-center justify-between px-8 pb-4 sm:px-16 sm:py-5 lg:px-28 ">
        <div className="flex items-center gap-x-2 py-10">
          <Image src={BluePlaneLogoWithoutText} height={30} width={30} alt="Plane Logo" className="mr-2" />
          <span className="text-2xl font-semibold sm:text-3xl">Plane</span>
        </div>
      </div>

      <div className="mx-auto h-full rounded-t-md border-x border-t border-custom-border-200 bg-onboarding-gradient-100 px-4 pt-4 shadow-sm sm:w-4/5 md:w-2/3 ">
        <div className="h-full overflow-auto rounded-t-md bg-onboarding-gradient-200 px-7 pb-56 pt-24 sm:px-0">
          <div className="mx-auto flex flex-col divide-y divide-custom-border-200 sm:w-96">
            <h1 className="sm:text-2.5xl text-center text-2xl font-medium text-onboarding-text-100">
              Get on your flight deck
            </h1>
            <p className="mt-2.5 text-center text-sm text-onboarding-text-200">Get a link to reset your password</p>
            <form onSubmit={handleSubmit(handleForgotPassword)} className="mx-auto mt-5 space-y-4 sm:w-96">
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
                  />
                )}
              />
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                size="xl"
                disabled={!isValid}
                loading={isSubmitting || resendTimerCode > 0}
              >
                {resendTimerCode > 0 ? `Request new link in ${resendTimerCode}s` : "Get link"}
              </Button>
            </form>
          </div>
          <LatestFeatureBlock />
        </div>
      </div>
    </div>
  );
};

ForgotPasswordPage.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};

export default ForgotPasswordPage;
