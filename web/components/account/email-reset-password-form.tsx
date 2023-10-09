import React from "react";

// react hook form
import { Controller, useForm } from "react-hook-form";
// services
import userService from "services/user.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, Input } from "@plane/ui";
// types
type Props = {
  setIsResettingPassword: React.Dispatch<React.SetStateAction<boolean>>;
};

export const EmailResetPasswordForm: React.FC<Props> = ({ setIsResettingPassword }) => {
  const { setToastAlert } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const forgotPassword = async (formData: any) => {
    const payload = {
      email: formData.email,
    };

    await userService
      .forgotPassword(payload)
      .then(() =>
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Password reset link has been sent to your email address.",
        })
      )
      .catch((err) => {
        if (err.status === 400)
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "Please check the Email ID entered.",
          });
        else
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "Something went wrong. Please try again.",
          });
      });
  };

  return (
    <form className="space-y-4 mt-10 w-full sm:w-[360px] mx-auto" onSubmit={handleSubmit(forgotPassword)}>
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
              placeholder="Enter registered email address.."
              className="border-custom-border-300 h-[46px] w-full"
            />
          )}
        />
      </div>
      <div className="mt-5 flex flex-col-reverse sm:flex-row items-center gap-2">
        <Button
          variant="secondary"
          className="w-full text-center h-[46px]"
          onClick={() => setIsResettingPassword(false)}
        >
          Go Back
        </Button>
        <Button variant="primary" type="submit" className="w-full text-center h-[46px]" loading={isSubmitting}>
          {isSubmitting ? "Sending link..." : "Send reset link"}
        </Button>
      </div>
    </form>
  );
};
