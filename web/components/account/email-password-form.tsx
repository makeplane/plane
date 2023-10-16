import React from "react";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/router";
// ui
import { Input, Button } from "@plane/ui";

export interface EmailPasswordFormValues {
  email: string;
  password?: string;
  medium?: string;
}

export interface IEmailPasswordForm {
  onSubmit: (formData: EmailPasswordFormValues) => Promise<void>;
}

export const EmailPasswordForm: React.FC<IEmailPasswordForm> = (props) => {
  const { onSubmit } = props;
  // router
  const router = useRouter();
  // form info
  const {
    control,
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
            render={({ field: { value, onChange } }) => (
              <Input
                id="email"
                type="email"
                name="email"
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.email)}
                placeholder="Enter your email address..."
                className="border-custom-border-300 h-[46px]"
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
            render={({ field: { value, onChange } }) => (
              <Input
                id="password"
                type="password"
                name="password"
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.password)}
                placeholder="Enter your password..."
                className="border-custom-border-300 h-[46px]"
              />
            )}
          />
        </div>
        <div className="text-right text-xs">
          <button
            type="button"
            onClick={() => router.push("/accounts/forgot-password")}
            className="text-custom-text-200 hover:text-custom-primary-100"
          >
            Forgot your password?
          </button>
        </div>
        <div>
          <Button
            type="submit"
            className="w-full text-center h-[46px]"
            disabled={!isValid && isDirty}
            loading={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </div>
        <div className="text-xs">
          <button
            type="button"
            onClick={() => router.push("/accounts/sign-up")}
            className="text-custom-text-200 hover:text-custom-primary-100"
          >
            {"Don't have an account? Sign Up"}
          </button>
        </div>
      </form>
    </>
  );
};
