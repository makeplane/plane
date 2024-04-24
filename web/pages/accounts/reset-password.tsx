import { ReactElement, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { Eye, EyeOff } from "lucide-react";
// ui
import { Button, Input } from "@plane/ui";
// components
import { PasswordStrengthMeter } from "@/components/account";
import { LatestFeatureBlock } from "@/components/common";
import { PageHead } from "@/components/core";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
import DefaultLayout from "@/layouts/default-layout";
import { NextPageWithLayout } from "@/lib/types";
// services
import { AuthService } from "@/services/auth.service";
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";


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
  const [resetFormData, setResetFormData] = useState<TResetPasswordFormValues>({
    ...defaultValues,
    email: email ? email.toString() : "",
  });
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  // store hooks
  //const { captureEvent } = useEventTracker();
  // sign in redirection hook
  //const { handleRedirection } = useSignInRedirection();

  const handleFormChange = (key: keyof TResetPasswordFormValues, value: string) =>
    setResetFormData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (csrfToken === undefined)
      authService.requestCSRFToken().then((data) => data?.csrf_token && setCsrfToken(data.csrf_token));
  }, [csrfToken]);

  return (
    <>
      <PageHead title="Reset Password" />
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
              <form
                className="mx-auto mt-11 space-y-4 sm:w-96"
                method="POST"
                action={`${API_BASE_URL}/auth/reset-password/${uidb64?.toString()}/${token?.toString()}/`}
              >
                <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
                <div className="space-y-1">
                  <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="email">
                    Email
                  </label>
                  <div className="relative flex items-center rounded-md bg-onboarding-background-200">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={resetFormData.email}
                      //hasError={Boolean(errors.email)}
                      placeholder="name@company.com"
                      className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 text-onboarding-text-400"
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="password">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center rounded-md bg-onboarding-background-200">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={resetFormData.password}
                      onChange={(e) => handleFormChange("password", e.target.value)}
                      //hasError={Boolean(errors.password)}
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
                  <PasswordStrengthMeter password={resetFormData.password} />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  size="xl"
                  // disabled={!isValid}
                  // loading={isSubmitting}
                >
                  Set password
                </Button>
              </form>
            </div>
            <LatestFeatureBlock />
          </div>
        </div>
      </div>
    </>
  );
};

ResetPasswordPage.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};

export default ResetPasswordPage;
