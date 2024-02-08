import { ReactElement, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { Controller, useForm } from "react-hook-form";
// services
import { AuthService } from "services/auth.service";
// hooks
import useToast from "hooks/use-toast";
import useSignInRedirection from "hooks/use-sign-in-redirection";
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
// icons
import { Eye, EyeOff } from "lucide-react";

type TResetPasswordFormValues = {
  email: string;
  password: string;
};

const defaultValues: TResetPasswordFormValues = {
  email: "",
  password: "",
};

// services
const authService = new AuthService();

const ResetPasswordPage: NextPageWithLayout = () => {
  // router
  const router = useRouter();
  const { uidb64, token, email } = router.query;
  // states
  const [showPassword, setShowPassword] = useState(false);
  // toast
  const { setToastAlert } = useToast();
  // sign in redirection hook
  const { handleRedirection } = useSignInRedirection();
  // form info
  const {
    control,
    formState: { errors, isSubmitting, isValid },
    handleSubmit,
  } = useForm<TResetPasswordFormValues>({
    defaultValues: {
      ...defaultValues,
      email: email?.toString() ?? "",
    },
  });

  const handleResetPassword = async (formData: TResetPasswordFormValues) => {
    if (!uidb64 || !token || !email) return;

    const payload = {
      new_password: formData.password,
    };

    await authService
      .resetPassword(uidb64.toString(), token.toString(), payload)
      .then(() => handleRedirection())
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
              Let{"'"}s get a new password
            </h1>
            <form onSubmit={handleSubmit(handleResetPassword)} className="mx-auto mt-11 space-y-4 sm:w-96">
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
                    className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 text-onboarding-text-400"
                    disabled
                  />
                )}
              />
              <Controller
                control={control}
                name="password"
                rules={{
                  required: "Password is required",
                }}
                render={({ field: { value, onChange } }) => (
                  <div className="relative flex items-center rounded-md bg-onboarding-background-200">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={value}
                      onChange={onChange}
                      hasError={Boolean(errors.password)}
                      placeholder="Enter password"
                      className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
                      minLength={8}
                    />
                    {showPassword ? (
                      <EyeOff
                        className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                        onClick={() => setShowPassword(false)}
                      />
                    ) : (
                      <Eye
                        className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                        onClick={() => setShowPassword(true)}
                      />
                    )}
                  </div>
                )}
              />
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                size="xl"
                disabled={!isValid}
                loading={isSubmitting}
              >
                Set password
              </Button>
            </form>
          </div>
          <LatestFeatureBlock />
        </div>
      </div>
    </div>
  );
};

ResetPasswordPage.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};

export default ResetPasswordPage;
