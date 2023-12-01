import { ReactElement, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import { Lightbulb } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
// services
import { AuthService } from "services/auth.service";
// hooks
import useToast from "hooks/use-toast";
// layouts
import DefaultLayout from "layouts/default-layout";
// ui
import { Button, Input } from "@plane/ui";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";
import latestFeatures from "public/onboarding/onboarding-pages.svg";
// helpers
import { checkEmailValidity } from "helpers/string.helper";
// type
import { NextPageWithLayout } from "types/app";
import { useMobxStore } from "lib/mobx/store-provider";
// types
import { IUser, IUserSettings } from "types";

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

const HomePage: NextPageWithLayout = () => {
  // router
  const router = useRouter();
  const { uidb64, token, email } = router.query;
  // next-themes
  const { resolvedTheme } = useTheme();
  // toast
  const { setToastAlert } = useToast();
  // mobx store
  const {
    user: { fetchCurrentUser, fetchCurrentUserSettings },
  } = useMobxStore();
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

  const handleSignInRedirection = useCallback(
    async (user: IUser) => {
      // if the user is not onboarded, redirect them to the onboarding page
      if (!user.is_onboarded) {
        router.push("/onboarding");
        return;
      }

      // if the user is onboarded, fetch their last workspace details
      await fetchCurrentUserSettings().then((userSettings: IUserSettings) => {
        const workspaceSlug =
          userSettings?.workspace?.last_workspace_slug || userSettings?.workspace?.fallback_workspace_slug;
        if (workspaceSlug) router.push(`/${workspaceSlug}`);
        else router.push("/profile");
      });
    },
    [fetchCurrentUserSettings, router]
  );

  const mutateUserInfo = useCallback(async () => {
    await fetchCurrentUser().then(async (user) => {
      await handleSignInRedirection(user);
    });
  }, [fetchCurrentUser, handleSignInRedirection]);

  const handleResetPassword = async (formData: TResetPasswordFormValues) => {
    if (!uidb64 || !token || !email) return;

    const payload = {
      new_password: formData.password,
    };

    await authService
      .resetPassword(uidb64.toString(), token.toString(), payload)
      .then(() => mutateUserInfo())
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        })
      );
  };

  return (
    <div className="bg-onboarding-gradient-100 h-full w-full">
      <div className="flex items-center justify-between sm:py-5 px-8 pb-4 sm:px-16 lg:px-28 ">
        <div className="flex gap-x-2 py-10 items-center">
          <Image src={BluePlaneLogoWithoutText} height={30} width={30} alt="Plane Logo" className="mr-2" />
          <span className="font-semibold text-2xl sm:text-3xl">Plane</span>
        </div>
      </div>

      <div className="h-full bg-onboarding-gradient-100 md:w-2/3 sm:w-4/5 px-4 pt-4 rounded-t-md mx-auto shadow-sm border-x border-t border-custom-border-200 ">
        <div className="px-7 sm:px-0 bg-onboarding-gradient-200 h-full pt-24 pb-56 rounded-t-md overflow-auto">
          <div className="sm:w-96 mx-auto flex flex-col divide-y divide-custom-border-200">
            <h1 className="text-center text-2xl sm:text-2.5xl font-medium text-onboarding-text-100">
              Let{"'"}s get a new password
            </h1>
            <form onSubmit={handleSubmit(handleResetPassword)} className="mt-11 sm:w-96 mx-auto space-y-4">
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
                    placeholder="orville.wright@firstflight.com"
                    className="w-full h-[46px] text-onboarding-text-400 border border-onboarding-border-100 pr-12"
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
                      className="w-full h-[46px] placeholder:text-onboarding-text-400 border border-onboarding-border-100 pr-12"
                      minLength={8}
                    />
                  )}
                />
                <p className="text-xs text-onboarding-text-200 mt-3">
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
                {isSubmitting ? "Signing in..." : "Go to workspace"}
              </Button>
              <p className="text-xs text-onboarding-text-200">
                When you click the button above, you agree with our{" "}
                <Link href="https://plane.so/terms-and-conditions" target="_blank" rel="noopener noreferrer">
                  <span className="font-semibold underline">terms and conditions of service.</span>
                </Link>
              </p>
            </form>
          </div>
          <div className="flex py-2 bg-onboarding-background-100 border border-onboarding-border-200 mx-auto rounded-[3.5px] sm:w-96 mt-16">
            <Lightbulb className="h-7 w-7 mr-2 mx-3" />
            <p className="text-sm text-left text-onboarding-text-100">
              Try the latest features, like Tiptap editor, to write compelling responses.{" "}
              <Link href="https://plane.so/changelog" target="_blank" rel="noopener noreferrer">
                <span className="font-medium text-sm underline hover:cursor-pointer">See new features</span>
              </Link>
            </p>
          </div>
          <div className="border border-onboarding-border-200 sm:w-96 sm:h-52 object-cover mt-8 mx-auto rounded-md bg-onboarding-background-100 overflow-hidden">
            <div className="h-[90%]">
              <Image
                src={latestFeatures}
                alt="Plane Issues"
                className={`rounded-md h-full ml-8 -mt-2 ${
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

HomePage.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};

export default HomePage;
