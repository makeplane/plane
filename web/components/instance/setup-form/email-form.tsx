import { FC } from "react";
import { useForm, Controller } from "react-hook-form";
// ui
import { Input, Button } from "@plane/ui";
// icons
import { XCircle } from "lucide-react";
// services
import { AuthService } from "services/auth.service";
const authService = new AuthService();
// hooks
import useToast from "hooks/use-toast";

export interface InstanceSetupEmailFormValues {
  email: string;
}

export interface IInstanceSetupEmailForm {
  handleNextStep: (email: string) => void;
}

export const InstanceSetupEmailForm: FC<IInstanceSetupEmailForm> = (props) => {
  const { handleNextStep } = props;
  // form info
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<InstanceSetupEmailFormValues>({
    defaultValues: {
      email: "",
    },
  });
  // hooks
  const { setToastAlert } = useToast();

  const handleEmailFormSubmit = (formValues: InstanceSetupEmailFormValues) =>
    authService
      .instanceAdminEmailCode({ email: formValues.email })
      .then(() => {
        reset();
        handleNextStep(formValues.email);
      })
      .catch((err) => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        });
      });

  return (
    <form onSubmit={handleSubmit(handleEmailFormSubmit)}>
      <h1 className="text-center text-2xl sm:text-2.5xl font-medium text-onboarding-text-100">
        Let{"'"}s secure your instance
      </h1>
      <p className="text-center text-sm text-onboarding-text-200 mt-3">
        Explore privacy options. Get AI features. Secure access.
        <br />
        Takes 2 minutes.
      </p>
      <div className="relative mt-5 w-full sm:w-96 mx-auto space-y-4">
        <Controller
          name="email"
          control={control}
          rules={{
            required: "Email address is required",
            validate: (value) =>
              /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
                value
              ) || "Email address is not valid",
          }}
          render={({ field: { value, onChange } }) => (
            <div className={`flex items-center relative rounded-md bg-onboarding-background-200`}>
              <Input
                id="email"
                name="email"
                type="email"
                value={value}
                onChange={onChange}
                placeholder="orville.wright@firstflight.com"
                className={`w-full h-[46px] placeholder:text-onboarding-text-400 border border-onboarding-border-100 pr-12`}
              />
              {value.length > 0 && (
                <XCircle
                  className="h-5 w-5 absolute stroke-custom-text-400 hover:cursor-pointer right-3"
                  onClick={() => setValue("email", "")}
                />
              )}
            </div>
          )}
        />
        <p className="text-xs text-custom-text-200 pb-2">
          Use your email address if you are the instance admin. <br /> Use your admin’s e-mail if you are not.
        </p>
        <Button variant="primary" className="w-full" size="xl" type="submit" loading={isSubmitting}>
          {isSubmitting ? "Sending code..." : "Send unique code"}
        </Button>
      </div>
    </form>
  );
};
