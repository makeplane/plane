import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";
import Image from "next/image";

// next-themes
import { useTheme } from "next-themes";
// react-hook-form
import { Controller, useForm } from "react-hook-form";
// hooks
import useToast from "hooks/use-toast";
// services
import { UserService } from "services/user.service";
// layouts
import DefaultLayout from "layouts/default-layout";
// ui
import { Button, Input, Spinner } from "@plane/ui";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";
// types
import type { NextPage } from "next";

type FormData = {
  password: string;
  confirmPassword: string;
};

// services
const userService = new UserService();

const ResetPasswordPage: NextPage = () => {
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const { uidb64, token } = router.query;

  const { setToastAlert } = useToast();

  const { setTheme } = useTheme();

  const {
    handleSubmit,
    control,
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
          message: err?.error || "Something went wrong. Please try again later or contact the support team.",
        })
      );
  };

  useEffect(() => {
    setTheme("system");
  }, [setTheme]);

  useEffect(() => {
    if (parseInt(process.env.NEXT_PUBLIC_ENABLE_OAUTH || "0")) router.push("/");
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
          <h1 className="text-center text-2xl sm:text-2.5xl font-semibold text-custom-text-100">Reset your password</h1>

          <form className="space-y-4 mt-10 w-full sm:w-[360px] mx-auto" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1">
              <Controller
                control={control}
                name="password"
                rules={{
                  required: "Password is required",
                }}
                render={({ field: { value, onChange, ref } }) => (
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    hasError={Boolean(errors.password)}
                    placeholder="Enter new password..."
                    className="border-custom-border-300 h-[46px] w-full"
                  />
                )}
              />
            </div>
            <div className="space-y-1">
              <Controller
                control={control}
                name="confirmPassword"
                rules={{
                  required: "Password is required",
                }}
                render={({ field: { value, onChange, ref } }) => (
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    hasError={Boolean(errors.confirmPassword)}
                    placeholder="Confirm new password..."
                    className="border-custom-border-300 h-[46px] w-full"
                  />
                )}
              />
            </div>
            <Button variant="primary" type="submit" className="w-full" loading={isSubmitting}>
              {isSubmitting ? "Resetting..." : "Reset"}
            </Button>
          </form>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default ResetPasswordPage;
