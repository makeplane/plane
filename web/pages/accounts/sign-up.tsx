import React, { useEffect, ReactElement } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
// next-themes
import { useTheme } from "next-themes";
// services
import { AuthService } from "services/auth.service";
// hooks
import useUserAuth from "hooks/use-user-auth";
import useToast from "hooks/use-toast";
// layouts
import DefaultLayout from "layouts/default-layout";
// components
import { EmailSignUpForm } from "components/account";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";
// types
import { NextPageWithLayout } from "types/app";

type EmailPasswordFormValues = {
  email: string;
  password?: string;
  medium?: string;
};

// services
const authService = new AuthService();

const SignUpPage: NextPageWithLayout = () => {
  const router = useRouter();

  const { setToastAlert } = useToast();

  const { setTheme } = useTheme();

  const { mutateUser } = useUserAuth("sign-in");

  const handleSignUp = async (formData: EmailPasswordFormValues) => {
    const payload = {
      email: formData.email,
      password: formData.password ?? "",
    };

    await authService
      .emailSignUp(payload)
      .then(async (response) => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Account created successfully.",
        });

        if (response) await mutateUser();
        router.push("/onboarding");
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

  return (
    <>
      <div className="left-20 top-0 hidden h-screen w-[0.5px] border-r-[0.5px] border-custom-border-200 sm:fixed sm:block lg:left-32" />
      <div className="fixed left-7 top-11 grid place-items-center bg-custom-background-100 sm:left-16 sm:top-12 sm:py-5 lg:left-28">
        <div className="grid place-items-center bg-custom-background-100">
          <div className="h-[30px] w-[30px]">
            <Image src={BluePlaneLogoWithoutText} alt="Plane Logo" />
          </div>
        </div>
      </div>
      <div className="grid h-full w-full place-items-center overflow-y-auto px-7 py-5">
        <div>
          <h1 className="font- text-center text-2xl">SignUp on Plane</h1>
          <EmailSignUpForm onSubmit={handleSignUp} />
        </div>
      </div>
    </>
  );
};

SignUpPage.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
};

export default SignUpPage;
