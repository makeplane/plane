import React from "react";

import { useRouter } from "next/router";
import Image from "next/image";

// react-hook-form
import { useForm } from "react-hook-form";
// hooks
import useToast from "hooks/use-toast";
// services
import userService from "services/user.service";
// layouts
import DefaultLayout from "layouts/default-layout";
// ui
import { Input, SecondaryButton } from "components/ui";
// icons
import Logo from "public/logo.png";
// types
import type { NextPage } from "next";

type FormData = {
  password: string;
  confirmPassword: string;
};

const ResetPasswordPage: NextPage = () => {
  const router = useRouter();
  const { uidb64, token } = router.query;

  const { setToastAlert } = useToast();

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

  return (
    <DefaultLayout>
      <div className="flex h-screen w-full items-center justify-center overflow-auto">
        <div className="flex min-h-full w-full flex-col justify-center py-12 px-6 lg:px-8">
          <div className="flex flex-col gap-10 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex flex-col items-center justify-center gap-10">
              <Image src={Logo} height={80} width={80} alt="Plane Web Logo" />
              <h2 className="text-center text-xl font-medium text-brand-base">
                Reset your password
              </h2>
            </div>
            <div className="flex flex-col rounded-[10px] bg-brand-base shadow-md">
              <form className="mt-5 py-5 px-5" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    register={register}
                    validations={{
                      required: "Password is required",
                    }}
                    error={errors.password}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="mt-5">
                  <Input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    register={register}
                    validations={{
                      required: "Confirm password is required",
                    }}
                    error={errors.confirmPassword}
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="mt-5">
                  <SecondaryButton
                    type="submit"
                    className="w-full text-center"
                    loading={isSubmitting}
                  >
                    {isSubmitting ? "Resetting..." : "Reset"}
                  </SecondaryButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default ResetPasswordPage;
