import { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import { Lightbulb } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
// services
import { AuthService } from "services/authentication.service";
// hooks
import useToast from "hooks/use-toast";
import useSignInRedirection from "hooks/use-sign-in-redirection";
// ui
import { Button, Input } from "@plane/ui";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text-new.png";
import latestFeatures from "public/onboarding/onboarding-pages.svg";
// helpers
import { checkEmailValidity } from "helpers/string.helper";

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

const HomePage: NextPage = () => {
  // router
  const router = useRouter();
  const { uidb64, token, email } = router.query;
  // next-themes
  const { resolvedTheme } = useTheme();
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
              <div>
                <Controller
                  control={control}
                  name="password"
                  rules={{
                    required: "Password is required",
                  }}
                  render={({ field: { value, onChange } }) => (
                    <Input
                      type="password"
                      value={value}
                      onChange={onChange}
                      hasError={Boolean(errors.password)}
                      placeholder="Choose password"
                      className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
                      minLength={8}
                    />
                  )}
                />
                <p className="mt-3 text-xs text-onboarding-text-200">
                  Whatever you choose now will be your account{"'"}s password until you change it.
                </p>
              </div>
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                size="xl"
                disabled={!isValid}
                loading={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Continue"}
              </Button>
              <p className="text-xs text-onboarding-text-200">
                When you click the button above, you agree with our{" "}
                <Link href="https://plane.so/terms-and-conditions" target="_blank" rel="noopener noreferrer">
                  <span className="font-semibold underline">terms and conditions of service.</span>
                </Link>
              </p>
            </form>
          </div>
          <div className="mx-auto mt-16 flex rounded-[3.5px] border border-onboarding-border-200 bg-onboarding-background-100 py-2 sm:w-96">
            <Lightbulb className="mx-3 mr-2 h-7 w-7" />
            <p className="text-left text-sm text-onboarding-text-100">
              Try the latest features, like Tiptap editor, to write compelling responses.{" "}
              <Link href="https://plane.so/changelog" target="_blank" rel="noopener noreferrer">
                <span className="text-sm font-medium underline hover:cursor-pointer">See new features</span>
              </Link>
            </p>
          </div>
          <div className="mx-auto mt-8 overflow-hidden rounded-md border border-onboarding-border-200 bg-onboarding-background-100 object-cover sm:h-52 sm:w-96">
            <div className="h-[90%]">
              <Image
                src={latestFeatures}
                alt="Plane Issues"
                className={`-mt-2 ml-8 h-full rounded-md ${
                  resolvedTheme === "dark" ? "bg-onboarding-background-100" : "bg-custom-primary-70"
                } `}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
