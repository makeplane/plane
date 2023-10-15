import React, { useEffect } from "react";
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
import type { NextPage } from "next";
type EmailPasswordFormValues = {
  email: string;
  password?: string;
  medium?: string;
};

// services
const authService = new AuthService();

const SignUp: NextPage = () => {
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
        <div>
          <h1 className="text-2xl text-center font-">SignUp on Plane</h1>
          <EmailSignUpForm onSubmit={handleSignUp} />
        </div>
      </div>
    </DefaultLayout>
  );
};

export default SignUp;
