import React from "react";
import { useForm } from "react-hook-form";
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
    // const payload = {
    //   email: formData.email,
    // };
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
    <form className="mx-auto mt-10 w-full space-y-4 sm:w-[360px]" onSubmit={handleSubmit(forgotPassword)}>
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
          className="h-[46px] border-custom-border-300"
        />
        {errors.email && <div className="text-sm text-red-500">{errors.email.message}</div>}
      </div>
      <div className="mt-5 flex flex-col-reverse items-center gap-2 sm:flex-row">
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
