import React, { useEffect, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/router";

// next-themes
import { useTheme } from "next-themes";
// services
import authenticationService from "services/authentication.service";
// hooks
import useUserAuth from "hooks/use-user-auth";
import useToast from "hooks/use-toast";
// layouts
import DefaultLayout from "layouts/default-layout";
// components
import { EmailPasswordForm } from "components/account";
// ui
import { Spinner } from "components/ui";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";
import getConfig from "next/config";
// types
import type { NextPage } from "next";
type EmailPasswordFormValues = {
  email: string;
  password?: string;
  medium?: string;
};

const SignUp: NextPage = () => {
  const [isLoading, setIsLoading] = useState(true);

  const { publicRuntimeConfig: { NEXT_PUBLIC_ENABLE_OAUTH } } = getConfig();

  const router = useRouter();

  const { setToastAlert } = useToast();

  const { setTheme } = useTheme();

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
        <div>
          <EmailPasswordForm onSubmit={handleSignUp} />
        </div>
      </div>
    </DefaultLayout>
  );
};

export default SignUp;
