import React from "react";
import Link from "next/link";
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
import { IPasswordSignInData } from "types/auth";

type Props = {
  email: string;
  updateEmail: (email: string) => void;
  handleSignInRedirection: () => Promise<void>;
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

export const SelfHostedSignInForm: React.FC<Props> = (props) => {
  const { email, updateEmail, handleSignInRedirection } = props;
  // toast alert
  const { setToastAlert } = useToast();
  // form info
  const {
    control,
    formState: { dirtyFields, errors, isSubmitting },
    handleSubmit,
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

    updateEmail(formData.email);

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

  return (
    <>
      <h1 className="text-center text-2xl sm:text-2.5xl font-semibold text-onboarding-text-100">
        Get on your flight deck
      </h1>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-11 sm:w-96 mx-auto space-y-4">
        <div>
          <Controller
            control={control}
            name="email"
            rules={{
              required: "Email is required",
              validate: (value) => checkEmailValidity(value) || "Email is invalid",
            }}
            render={({ field: { value, onChange } }) => (
              <div className="flex items-center relative rounded-md bg-onboarding-background-200">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={value}
                  onChange={onChange}
                  hasError={Boolean(errors.email)}
                  placeholder="orville.wright@firstflight.com"
                  className="w-full h-[46px] placeholder:text-onboarding-text-400 border border-onboarding-border-100 pr-12"
                />
                {value.length > 0 && (
                  <XCircle
                    className="h-5 w-5 absolute stroke-custom-text-400 hover:cursor-pointer right-3"
                    onClick={() => onChange("")}
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
                placeholder="Enter password"
                className="w-full h-[46px] placeholder:text-onboarding-text-400 border border-onboarding-border-100 pr-12 !bg-onboarding-background-200"
              />
            )}
          />
        </div>
        <Button type="submit" variant="primary" className="w-full" size="xl" loading={isSubmitting}>
          Go to workspace
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
