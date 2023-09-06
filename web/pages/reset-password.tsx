import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";
import Image from "next/image";

// next-themes
import { useTheme } from "next-themes";
// react-hook-form
import { useForm } from "react-hook-form";
// hooks
import useToast from "hooks/use-toast";
// services
import userService from "services/user.service";
// layouts
import DefaultLayout from "layouts/default-layout";
// ui
import { Input, PrimaryButton, Spinner } from "components/ui";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";
// types
import type { NextPage } from "next";
import getConfig from "next/config";

type FormData = {
  password: string;
  confirmPassword: string;
};

const ResetPasswordPage: NextPage = () => {
  const [isLoading, setIsLoading] = useState(true);

  const { publicRuntimeConfig: { NEXT_PUBLIC_ENABLE_OAUTH } } = getConfig();

  const router = useRouter();
  const { uidb64, token } = router.query;

  const { setToastAlert } = useToast();

  const { setTheme } = useTheme();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const onSubmit = async (formData: FormData) => {
    if (!uidb64 || !token) return;

    if (formData.password !== formData.confirmPassword) {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Passwords do not match.",
      });

      return;
    }

    const payload = {
      new_password: formData.password,
      confirm_password: formData.confirmPassword,
    };

    await userService
      .resetPassword(uidb64.toString(), token.toString(), payload)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Password reset successfully. You can now login with your new password.",
        });
        router.push("/");
      })
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message:
            err?.error ||
            "Something went wrong. Please try again later or contact the support team.",
        })
      );
  };

  useEffect(() => {
    setTheme("system");
  }, [setTheme]);

  useEffect(() => {
    if (parseInt(NEXT_PUBLIC_ENABLE_OAUTH || "0")) router.push("/");
    else setIsLoading(false);
  }, [router]);

  if (isLoading)
    return (
      <div className="grid place-items-center h-screen w-full">
        <Spinner />
      </div>
    );

  return (
    <DefaultLayout>
      <>
        <div className="hidden sm:block sm:fixed border-r-[0.5px] border-custom-border-200 h-screen w-[0.5px] top-0 left-20 lg:left-32" />
        <div className="fixed grid place-items-center bg-custom-background-100 sm:py-5 top-11 sm:top-12 left-7 sm:left-16 lg:left-28">
          <div className="grid place-items-center bg-custom-background-100">
            <div className="h-[30px] w-[30px]">
              <Image src={BluePlaneLogoWithoutText} alt="Plane Logo" />
            </div>
          </div>
        </div>
      </>
      <div className="grid place-items-center h-full w-full overflow-y-auto py-5 px-7">
        <div className="w-full">
          <h1 className="text-center text-2xl sm:text-2.5xl font-semibold text-custom-text-100">
            Reset your password
          </h1>

          <form
            className="space-y-4 mt-10 w-full sm:w-[360px] mx-auto"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="space-y-1">
              <Input
                id="password"
                type="password"
                name="password"
                register={register}
                validations={{
                  required: "Password is required",
                }}
                error={errors.password}
                placeholder="Enter new password..."
                className="border-custom-border-300 h-[46px]"
              />
            </div>
            <div className="space-y-1">
              <Input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                register={register}
                validations={{
                  required: "Password confirmation is required",
                }}
                error={errors.confirmPassword}
                placeholder="Confirm new password..."
                className="border-custom-border-300 h-[46px]"
              />
            </div>
            <PrimaryButton
              type="submit"
              className="w-full text-center h-[46px]"
              loading={isSubmitting}
            >
              {isSubmitting ? "Resetting..." : "Reset"}
            </PrimaryButton>
          </form>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default ResetPasswordPage;
