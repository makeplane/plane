import React from "react";
import { Controller, useForm } from "react-hook-form";
// services
import { AuthService } from "services/authentication.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, Input } from "@plane/ui";
// helpers
import { checkEmailValidity } from "helpers/string.helper";
// types
import { IEmailCheckData } from "types/auth";

type Props = {
  email: string;
  updateEmail: (email: string) => void;
};

const authService = new AuthService();

export const SetPasswordLink: React.FC<Props> = (props) => {
  const { email, updateEmail } = props;

  const { setToastAlert } = useToast();

  const {
    control,
    formState: { errors, isSubmitting, isValid },
    handleSubmit,
  } = useForm({
    defaultValues: {
      email,
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const handleSendNewLink = async (formData: { email: string }) => {
    updateEmail(formData.email);

    const payload: IEmailCheckData = {
      email: formData.email,
    };

    await authService
      .sendResetPasswordLink(payload)
      .then(() =>
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "We have sent a new link to your email.",
        })
      )
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
      <h1 className="sm:text-2.5xl text-center text-2xl font-medium text-onboarding-text-100">
        Get on your flight deck
      </h1>
      <p className="mt-2.5 px-20 text-center text-sm text-onboarding-text-200">
        We have sent a link to <span className="font-semibold text-custom-primary-100">{email},</span> so you can set a
        password
      </p>

      <form onSubmit={handleSubmit(handleSendNewLink)} className="mx-auto mt-5 space-y-4 sm:w-96">
        <div className="space-y-1">
          <Controller
            control={control}
            name="email"
            rules={{
              required: "Email is required",
              validate: (value) => checkEmailValidity(value) || "Email is invalid",
            }}
            render={({ field: { value, onChange } }) => (
              <Input
                id="email"
                name="email"
                type="email"
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.email)}
                placeholder="name@company.com"
                className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 text-onboarding-text-400"
                disabled
              />
            )}
          />
        </div>
        <Button type="submit" variant="primary" className="w-full" size="xl" disabled={!isValid} loading={isSubmitting}>
          {isSubmitting ? "Sending new link" : "Get link again"}
        </Button>
      </form>
    </>
  );
};
