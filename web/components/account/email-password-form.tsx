import React from "react";
import { Controller, useForm } from "react-hook-form";
// ui
import { Button, Input } from "@plane/ui";
// types
type EmailPasswordFormValues = {
  email: string;
  password?: string;
  medium?: string;
};

type Props = {
  onSubmit: (formData: EmailPasswordFormValues) => Promise<void>;
  setIsResettingPassword: (value: boolean) => void;
};

export const EmailPasswordForm: React.FC<Props> = (props) => {
  const { onSubmit, setIsResettingPassword } = props;
  // form info
  const {
    register,
    handleSubmit,
    control,
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
      <form className="space-y-4 mt-10 w-full sm:w-[360px] mx-auto" onSubmit={handleSubmit(onSubmit)}>
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
                className="border-custom-border-300 h-[46px] w-full "
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
                className="border-custom-border-300 h-[46px] w-full"
              />
            )}
          />
        </div>
        <div className="text-right text-xs">
          <button
            type="button"
            onClick={() => setIsResettingPassword(true)}
            className="text-custom-text-200 hover:text-custom-primary-100"
          >
            Forgot your password?
          </button>
        </div>
        <div>
          <Button
            variant="primary"
            type="submit"
            className="w-full text-center h-[46px]"
            disabled={!isValid && isDirty}
            loading={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </form>
    </>
  );
};
