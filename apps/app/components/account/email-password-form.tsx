import React, { useState } from "react";

import { useRouter } from "next/router";
import Link from "next/link";

// react hook form
import { useForm } from "react-hook-form";
// components
import { EmailResetPasswordForm } from "components/account";
// ui
import { Input, SecondaryButton } from "components/ui";
// types
type EmailPasswordFormValues = {
  email: string;
  password?: string;
  medium?: string;
};

type Props = {
  onSubmit: (formData: EmailPasswordFormValues) => Promise<void>;
};

export const EmailPasswordForm: React.FC<Props> = ({ onSubmit }) => {
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const router = useRouter();
  const isSignUpPage = router.pathname === "/sign-up";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<EmailPasswordFormValues>({
    defaultValues: {
      email: "",
      password: "",
      medium: "email",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  return (
    <>
      {isResettingPassword ? (
        <EmailResetPasswordForm setIsResettingPassword={setIsResettingPassword} />
      ) : (
        <form className="mt-5 py-5 px-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Input
              id="email"
              type="email"
              name="email"
              register={register}
              validations={{
                required: "Email ID is required",
                validate: (value) =>
                  /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
                    value
                  ) || "Email ID is not valid",
              }}
              error={errors.email}
              placeholder="Enter your email ID"
            />
          </div>
          <div className="mt-5">
            <Input
              id="password"
              type="password"
              name="password"
              register={register}
              validations={{
                required: "Password is required",
              }}
              error={errors.password}
              placeholder="Enter your password"
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="ml-auto text-sm">
              {isSignUpPage ? (
                <Link href="/">
                  <a className="font-medium text-custom-primary hover:text-custom-primary">
                    Already have an account? Sign in.
                  </a>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsResettingPassword(true)}
                  className="font-medium text-custom-primary hover:text-custom-primary"
                >
                  Forgot your password?
                </button>
              )}
            </div>
          </div>
          <div className="mt-5">
            <SecondaryButton
              type="submit"
              className="w-full text-center"
              disabled={!isValid && isDirty}
              loading={isSubmitting}
            >
              {isSignUpPage
                ? isSubmitting
                  ? "Signing up..."
                  : "Sign Up"
                : isSubmitting
                ? "Signing in..."
                : "Sign In"}
            </SecondaryButton>
            {!isSignUpPage && (
              <Link href="/sign-up">
                <a className="block font-medium text-custom-primary hover:text-custom-primary text-sm mt-1">
                  Don{"'"}t have an account? Sign up.
                </a>
              </Link>
            )}
          </div>
        </form>
      )}
    </>
  );
};
