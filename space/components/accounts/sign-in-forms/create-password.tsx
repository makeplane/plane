import React, { useEffect } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
// services
import { AuthService } from "services/authentication.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, Input } from "@plane/ui";
// helpers
import { checkEmailValidity } from "helpers/string.helper";
// constants
import { ESignInSteps } from "components/accounts";

type Props = {
  email: string;
  handleStepChange: (step: ESignInSteps) => void;
  handleSignInRedirection: () => Promise<void>;
  isOnboarded: boolean;
};

type TCreatePasswordFormValues = {
  email: string;
  password: string;
};

const defaultValues: TCreatePasswordFormValues = {
  email: "",
  password: "",
};

// services
const authService = new AuthService();

export const CreatePasswordForm: React.FC<Props> = (props) => {
  const { email, handleSignInRedirection, isOnboarded } = props;
  // toast alert
  const { setToastAlert } = useToast();
  // form info
  const {
    control,
    formState: { errors, isSubmitting, isValid },
    setFocus,
    handleSubmit,
  } = useForm<TCreatePasswordFormValues>({
    defaultValues: {
      ...defaultValues,
      email,
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const handleCreatePassword = async (formData: TCreatePasswordFormValues) => {
    const payload = {
      password: formData.password,
    };

    await authService
      .setPassword(payload)
      .then(async () => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Password created successfully.",
        });
        await handleSignInRedirection();
      })
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
      <h1 className="sm:text-2.5xl text-center text-2xl font-medium text-onboarding-text-100">
        Get on your flight deck
      </h1>
      <form onSubmit={handleSubmit(handleCreatePassword)} className="mx-auto mt-11 space-y-4 sm:w-96">
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
              placeholder="name@company.com"
              className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 text-onboarding-text-400"
              disabled
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          rules={{
            required: "Password is required",
          }}
          render={({ field: { value, onChange, ref } }) => (
            <Input
              type="password"
              value={value}
              onChange={onChange}
              ref={ref}
              hasError={Boolean(errors.password)}
              placeholder="Choose password"
              className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
              minLength={8}
            />
          )}
        />
        <Button type="submit" variant="primary" className="w-full" size="xl" disabled={!isValid} loading={isSubmitting}>
          {isOnboarded ? "Go to board" : "Set up profile"}
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
};
