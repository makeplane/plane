import React from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
// services
import userService from "services/user.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Input, PrimaryButton, SecondaryButton } from "components/ui";
// types
type Props = {
  onSubmit: (formValues: any) => void;
};

export const EmailResetPasswordForm: React.FC<Props> = (props) => {
  const { onSubmit } = props;
  // toast
  const { setToastAlert } = useToast();
  // router
  const router = useRouter();
  // form data
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
    <form className="space-y-4 mt-10 w-full sm:w-[360px] mx-auto" onSubmit={handleSubmit(forgotPassword)}>
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
          placeholder="Enter registered email address.."
          className="border-custom-border-300 h-[46px]"
        />
      </div>
      <div className="mt-5 flex flex-col-reverse sm:flex-row items-center gap-2">
        <SecondaryButton className="w-full text-center h-[46px]" onClick={() => router.push("/")}>
          Go Back
        </SecondaryButton>
        <PrimaryButton type="submit" className="w-full text-center h-[46px]" loading={isSubmitting}>
          {isSubmitting ? "Sending link..." : "Send reset link"}
        </PrimaryButton>
      </div>
    </form>
  );
};
