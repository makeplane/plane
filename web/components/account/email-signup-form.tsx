import React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
// ui
import { Input, PrimaryButton } from "components/ui";
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
    register,
    handleSubmit,
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
      <form
        className="space-y-4 mt-10 w-full sm:w-[360px] mx-auto"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="space-y-1">
          <Input
            id="email"
            type="email"
            name="email"
            register={register}
            validations={{
              required: "Email address is required",
              validate: (value) =>
                /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
                  value
                ) || "Email address is not valid",
            }}
            error={errors.email}
            placeholder="Enter your email address..."
            className="border-custom-border-300 h-[46px]"
          />
        </div>
        <div className="space-y-1">
          <Input
            id="password"
            type="password"
            name="password"
            register={register}
            validations={{
              required: "Password is required",
            }}
            error={errors.password}
            placeholder="Enter your password..."
            className="border-custom-border-300 h-[46px]"
          />
        </div>
        <div className="space-y-1">
          <Input
            id="confirm_password"
            type="password"
            name="confirm_password"
            register={register}
            validations={{
              required: "Password is required",
              validate: (val: string) => {
                if (watch("password") != val) {
                  return "Your passwords do no match";
                }
              },
            }}
            error={errors.confirm_password}
            placeholder="Confirm your password..."
            className="border-custom-border-300 h-[46px]"
          />
        </div>
        <div className="text-right text-xs">
          <Link href="/">
            <a className="text-custom-text-200 hover:text-custom-primary-100">
              Already have an account? Sign in.
            </a>
          </Link>
        </div>
        <div>
          <PrimaryButton
            type="submit"
            className="w-full text-center h-[46px]"
            disabled={!isValid && isDirty}
            loading={isSubmitting}
          >
            {isSubmitting ? "Signing up..." : "Sign up"}
          </PrimaryButton>
        </div>
      </form>
    </>
  );
};
