import { FC } from "react";
import { useRouter } from "next/router";
import { useForm, Controller } from "react-hook-form";
// ui
import { Input, Button } from "@plane/ui";

export interface EmailForgotPasswordFormValues {
  email: string;
}

export interface IEmailForgotPasswordForm {
  onSubmit: (formValues: any) => Promise<void>;
}

export const EmailForgotPasswordForm: FC<IEmailForgotPasswordForm> = (props) => {
  const { onSubmit } = props;
  // router
  const router = useRouter();
  // form data
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailForgotPasswordFormValues>({
    defaultValues: {
      email: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  return (
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
              placeholder="Enter registered email address.."
              className="border-custom-border-300 h-[46px]"
            />
          )}
        />
      </div>
      <div className="mt-5 flex flex-col-reverse sm:flex-row items-center gap-2">
        <Button className="w-full text-center h-[46px]" onClick={() => router.push("/")}>
          Go Back
        </Button>
        <Button type="submit" className="w-full text-center h-[46px]" loading={isSubmitting}>
          {isSubmitting ? "Sending link..." : "Send reset link"}
        </Button>
      </div>
    </form>
  );
};
