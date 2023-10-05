import React from "react";
import { useForm } from "react-hook-form";
// ui
import { Input, PrimaryButton } from "components/ui";
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
          <PrimaryButton
            type="submit"
            className="w-full text-center h-[46px]"
            disabled={!isValid && isDirty}
            loading={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </PrimaryButton>
        </div>
      </form>
    </>
  );
};
