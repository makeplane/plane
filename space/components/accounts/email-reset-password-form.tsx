import React from "react";

// react hook form
import { useForm } from "react-hook-form";
// services
import userService from "services/user.service";
// hooks
// import useToast from "hooks/use-toast";
// ui
import { Input } from "components/ui";
import { Button } from "@plane/ui";
// types
type Props = {
  setIsResettingPassword: React.Dispatch<React.SetStateAction<boolean>>;
};

export const EmailResetPasswordForm: React.FC<Props> = ({ setIsResettingPassword }) => {
  // const { setToastAlert } = useToast();

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

    // await userService
    //   .forgotPassword(payload)
    //   .then(() =>
    //     setToastAlert({
    //       type: "success",
    //       title: "Success!",
    //       message: "Password reset link has been sent to your email address.",
    //     })
    //   )
    //   .catch((err) => {
    //     if (err.status === 400)
    //       setToastAlert({
    //         type: "error",
    //         title: "Error!",
    //         message: "Please check the Email ID entered.",
    //       });
    //     else
    //       setToastAlert({
    //         type: "error",
    //         title: "Error!",
    //         message: "Something went wrong. Please try again.",
    //       });
    //   });
  };

  return (
    <form className="space-y-4 mt-10 w-full sm:w-[360px] mx-auto" onSubmit={handleSubmit(forgotPassword)}>
      <div className="space-y-1">
        <Input
          id="email"
          type="email"
          {...register("email", {
            required: "Email address is required",
            validate: (value) =>
              /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
                value
              ) || "Email address is not valid",
          })}
          placeholder="Enter registered email address.."
          className="border-custom-border-300 h-[46px]"
        />
        {errors.email && <div className="text-sm text-red-500">{errors.email.message}</div>}
      </div>
      <div className="mt-5 flex flex-col-reverse sm:flex-row items-center gap-2">
        <Button variant="neutral-primary" className="w-full" onClick={() => setIsResettingPassword(false)}>
          Go Back
        </Button>
        <Button variant="primary" className="w-full" type="submit" loading={isSubmitting}>
          {isSubmitting ? "Sending link..." : "Send reset link"}
        </Button>
      </div>
    </form>
  );
};
