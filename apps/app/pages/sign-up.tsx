import React from "react";

import Image from "next/image";
import { useRouter } from "next/router";

// services
import authenticationService from "services/authentication.service";
// hooks
import useUserAuth from "hooks/use-user-auth";
import useToast from "hooks/use-toast";
// layouts
import DefaultLayout from "layouts/default-layout";
// components
import { EmailPasswordForm } from "components/account";
// images
import Logo from "public/logo.png";
// types
import type { NextPage } from "next";
type EmailPasswordFormValues = {
  email: string;
  password?: string;
  medium?: string;
};

const SignUp: NextPage = () => {
  const router = useRouter();

  const { setToastAlert } = useToast();

  const { mutateUser } = useUserAuth("sign-in");

  const handleSignUp = async (formData: EmailPasswordFormValues) => {
    const payload = {
      email: formData.email,
      password: formData.password ?? "",
    };

    await authenticationService
      .emailSignUp(payload)
      .then(async (response) => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Account created successfully.",
        });

        if (response) await mutateUser();
        router.push("/");
      })
      .catch((err) => {
        if (err.status === 400)
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "An user already exists with this Email ID.",
          });
        else
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "Something went wrong. Please try again later or contact the support team.",
          });
      });
  };

  return (
    <DefaultLayout>
      <div className="flex h-screen w-full items-center justify-center overflow-auto">
        <div className="flex min-h-full w-full flex-col justify-center py-12 px-6 lg:px-8">
          <div className="flex flex-col gap-10 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex flex-col items-center justify-center gap-10">
              <Image src={Logo} height={80} width={80} alt="Plane Web Logo" />
              <div className="text-center text-xl font-medium text-brand-base">
                Create a new Plane Account
              </div>
            </div>

            <div className="flex flex-col rounded-[10px] bg-brand-base shadow-md">
              <EmailPasswordForm onSubmit={handleSignUp} />
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default SignUp;
