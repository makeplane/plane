import React from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
// ui
import { Button, Input } from "@plane/ui";
// types
type EmailPasswordFormValues = {
  email: string;
  password?: string;
  confirm_password: string;
  medium?: string;
};

type Props = {
  onSubmit: (formData: EmailPasswordFormValues) => Promise<void>;
};

export const EmailSignUpForm: React.FC<Props> = (props) => {
  const { onSubmit } = props;

  const {
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<EmailPasswordFormValues>({
    defaultValues: {
      email: "",
      password: "",
      confirm_password: "",
      medium: "email",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  return (
    <>
      <form className="mx-auto mt-10 w-full space-y-4 sm:w-[360px]" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1">
          <Controller
            control={control}
            name="email"
            rules={{
              required: "Email address is required",
              validate: (value) =>
                /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
                  value
                ) || "Email address is not valid",
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
                placeholder="Enter your email address..."
                className="h-[46px] w-full border-custom-border-300"
              />
            )}
          />
        </div>
        <div className="space-y-1">
          <Controller
            control={control}
            name="password"
            rules={{
              required: "Password is required",
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="password"
                name="password"
                type="password"
                value={value ?? ""}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.password)}
                placeholder="Enter your password..."
                className="h-[46px] w-full border-custom-border-300"
              />
            )}
          />
        </div>
        <div className="space-y-1">
          <Controller
            control={control}
            name="confirm_password"
            rules={{
              required: "Password is required",
              validate: (val: string) => {
                if (watch("password") != val) {
                  return "Your passwords do no match";
                }
              },
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.confirm_password)}
                placeholder="Confirm your password..."
                className="h-[46px] w-full border-custom-border-300"
              />
            )}
          />
        </div>
        <div className="text-right text-xs">
          <Link href="/">
            <span className="text-custom-text-200 hover:text-custom-primary-100">
              Already have an account? Sign in.
            </span>
          </Link>
        </div>
        <div>
          <Button
            variant="primary"
            type="submit"
            className="w-full"
            size="xl"
            disabled={!isValid && isDirty}
            loading={isSubmitting}
          >
            {isSubmitting ? "Signing up..." : "Sign up"}
          </Button>
        </div>
      </form>
    </>
  );
};
