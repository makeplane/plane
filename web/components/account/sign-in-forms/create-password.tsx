import React from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
// services
import { AuthService } from "services/auth.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, Input } from "@plane/ui";
// helpers
import { checkEmailValidity } from "helpers/string.helper";
// constants
import { ESignInSteps } from "components/account";

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

  return (
    <>
      <h1 className="text-center text-2xl sm:text-2.5xl font-medium text-onboarding-text-100">
        Get on your flight deck
      </h1>
      <form onSubmit={handleSubmit(handleCreatePassword)} className="mt-11 sm:w-96 mx-auto space-y-4">
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
              placeholder="orville.wright@firstflight.com"
              className="w-full h-[46px] text-onboarding-text-400 border border-onboarding-border-100 pr-12 !bg-onboarding-background-200"
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
              className="w-full h-[46px] placeholder:text-onboarding-text-400 border border-onboarding-border-100 pr-12 !bg-onboarding-background-200"
              minLength={8}
            />
          )}
        />
        <Button type="submit" variant="primary" className="w-full" size="xl" disabled={!isValid} loading={isSubmitting}>
          {isOnboarded ? "Go to workspace" : "Set up workspace"}
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
