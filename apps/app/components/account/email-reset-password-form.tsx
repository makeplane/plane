import React from "react";

// react hook form
import { useForm } from "react-hook-form";
// services
import userService from "services/user.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Input, PrimaryButton, SecondaryButton } from "components/ui";
// types
type Props = {
  setIsResettingPassword: React.Dispatch<React.SetStateAction<boolean>>;
};

export const EmailResetPasswordForm: React.FC<Props> = ({ setIsResettingPassword }) => {
  const { setToastAlert } = useToast();

  const {
    register,
    handleSubmit,
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
    <form className="mt-5 py-5 px-5" onSubmit={handleSubmit(forgotPassword)}>
      <div>
        <Input
          id="email"
          type="email"
          name="email"
          register={register}
          validations={{
            required: "Email ID is required",
            validate: (value) =>
              /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
                value
              ) || "Email ID is not valid",
          }}
          error={errors.email}
          placeholder="Enter registered Email ID"
        />
      </div>
      <div className="mt-5 flex items-center gap-2">
        <SecondaryButton
          className="w-full text-center"
          onClick={() => setIsResettingPassword(false)}
        >
          Go Back
        </SecondaryButton>
        <PrimaryButton type="submit" className="w-full text-center" loading={isSubmitting}>
          {isSubmitting ? "Sending link..." : "Send reset link"}
        </PrimaryButton>
      </div>
    </form>
  );
};
