import React, { useState } from "react";
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
import { ESignUpSteps } from "components/account";
// icons
import { Eye, EyeOff } from "lucide-react";

type Props = {
  email: string;
  handleStepChange: (step: ESignUpSteps) => void;
  handleSignInRedirection: () => Promise<void>;
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

export const SignUpOptionalSetPasswordForm: React.FC<Props> = (props) => {
  const { email, handleSignInRedirection } = props;
  // states
  const [isGoingToWorkspace, setIsGoingToWorkspace] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const handleGoToWorkspace = async () => {
    setIsGoingToWorkspace(true);

    await handleSignInRedirection().finally(() => setIsGoingToWorkspace(false));
  };

  return (
    <>
      <h1 className="sm:text-2.5xl text-center text-2xl font-medium text-onboarding-text-100">Moving to the runway</h1>
      <p className="mt-2.5 text-center text-sm text-onboarding-text-200">
        Let{"'"}s set a password so
        <br />
        you can do away with codes.
      </p>
      <form onSubmit={handleSubmit(handleCreatePassword)} className="mx-auto mt-5 space-y-4 sm:w-96">
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
        <div>
          <Controller
            control={control}
            name="password"
            rules={{
              required: "Password is required",
            }}
            render={({ field: { value, onChange } }) => (
              <div className="relative flex items-center rounded-md bg-onboarding-background-200">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={value}
                  onChange={onChange}
                  hasError={Boolean(errors.password)}
                  placeholder="Enter password"
                  className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
                  minLength={8}
                  autoFocus
                />
                {showPassword ? (
                  <EyeOff
                    className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                    onClick={() => setShowPassword(false)}
                  />
                ) : (
                  <Eye
                    className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                    onClick={() => setShowPassword(true)}
                  />
                )}
              </div>
            )}
          />
          <p className="text-onboarding-text-200 text-xs mt-2 pb-3">
            This password will continue to be your account{"'"}s password.
          </p>
        </div>
        <div className="space-y-2.5">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            size="xl"
            disabled={!isValid}
            loading={isSubmitting}
          >
            Set password
          </Button>
          <Button
            type="button"
            variant="outline-primary"
            className="w-full"
            size="xl"
            onClick={handleGoToWorkspace}
            loading={isGoingToWorkspace}
          >
            Skip to setup
          </Button>
        </div>
      </form>
    </>
  );
};
