import React, { useEffect } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { Controller, useForm } from "react-hook-form";
import { XCircle } from "lucide-react";
// services
import { AuthService } from "services/auth.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, Input } from "@plane/ui";
// helpers
import { checkEmailValidity } from "helpers/string.helper";
// types
import { IPasswordSignInData } from "@plane/types";

type Props = {
  email: string;
  handleSignInRedirection: () => Promise<void>;
  handleEmailClear: () => void;
};

type TPasswordFormValues = {
  email: string;
  password: string;
};

const defaultValues: TPasswordFormValues = {
  email: "",
  password: "",
};

const authService = new AuthService();

export const SignUpPasswordForm: React.FC<Props> = observer((props) => {
  const { email, handleSignInRedirection, handleEmailClear } = props;
  // toast alert
  const { setToastAlert } = useToast();
  // form info
  const {
    control,
    formState: { dirtyFields, errors, isSubmitting, isValid },
    handleSubmit,
    setFocus,
  } = useForm<TPasswordFormValues>({
    defaultValues: {
      ...defaultValues,
      email,
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const handleFormSubmit = async (formData: TPasswordFormValues) => {
    const payload: IPasswordSignInData = {
      email: formData.email,
      password: formData.password,
    };

    await authService
      .passwordSignIn(payload)
      .then(async () => await handleSignInRedirection())
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        })
      );
  };

  useEffect(() => {
    setFocus("password");
  }, [setFocus]);

  return (
    <>
      <h1 className="sm:text-2.5xl text-center text-2xl font-semibold text-onboarding-text-100">
        Moving to the runway
      </h1>
      <p className="mt-2.5 text-center text-sm text-onboarding-text-200">
        Let{"'"}s set a password so you can do away with codes.
      </p>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="mx-auto mt-5 space-y-4 sm:w-96">
        <div>
          <Controller
            control={control}
            name="email"
            rules={{
              required: "Email is required",
              validate: (value) => checkEmailValidity(value) || "Email is invalid",
            }}
            render={({ field: { value, onChange } }) => (
              <div className="relative flex items-center rounded-md bg-onboarding-background-200">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={value}
                  onChange={onChange}
                  hasError={Boolean(errors.email)}
                  placeholder="orville.wright@frstflt.com"
                  className="h-[46px] w-full border border-onboarding-border-100 pr-12 placeholder:text-onboarding-text-400"
                  disabled
                />
                {value.length > 0 && (
                  <XCircle
                    className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                    onClick={handleEmailClear}
                  />
                )}
              </div>
            )}
          />
        </div>
        <div>
          <Controller
            control={control}
            name="password"
            rules={{
              required: dirtyFields.email ? false : "Password is required",
            }}
            render={({ field: { value, onChange } }) => (
              <Input
                type="password"
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.password)}
                placeholder="Choose password"
                className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
              />
            )}
          />
          <p className="text-onboarding-text-200 text-xs mt-2 pb-3">
            This password will continue to be your account{"'"}s password
          </p>
        </div>
        <Button type="submit" variant="primary" className="w-full" size="xl" disabled={!isValid} loading={isSubmitting}>
          Create account
        </Button>
        <p className="text-xs text-onboarding-text-200">
          When you click the button above, you agree with our{" "}
          <Link href="https://plane.so/terms-and-conditions" target="_blank" rel="noopener noreferrer">
            <span className="font-semibold underline">terms and conditions of service.</span>
          </Link>
        </p>
      </form>
    </>
  );
});
