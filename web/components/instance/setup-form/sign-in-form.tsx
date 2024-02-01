import { FC, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Eye, EyeOff, XCircle } from "lucide-react";
// hooks
import { useUser } from "hooks/store";
// ui
import { Input, Button } from "@plane/ui";
// services
import { AuthService } from "services/auth.service";
const authService = new AuthService();
// hooks
import useToast from "hooks/use-toast";
// helpers
import { checkEmailValidity } from "helpers/string.helper";

interface InstanceSetupEmailFormValues {
  email: string;
  password: string;
}

export interface IInstanceSetupEmailForm {
  handleNextStep: (email: string) => void;
}

export const InstanceSetupSignInForm: FC<IInstanceSetupEmailForm> = (props) => {
  const { handleNextStep } = props;
  // states
  const [showPassword, setShowPassword] = useState(false);
  // store hooks
  const { fetchCurrentUser } = useUser();
  // form info
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    setValue,
  } = useForm<InstanceSetupEmailFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });
  // hooks
  const { setToastAlert } = useToast();

  const handleFormSubmit = async (formValues: InstanceSetupEmailFormValues) => {
    const payload = {
      email: formValues.email,
      password: formValues.password,
    };

    await authService
      .instanceAdminSignIn(payload)
      .then(async () => {
        await fetchCurrentUser();
        handleNextStep(formValues.email);
      })
      .catch((err) => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        });
      });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <h1 className="sm:text-2.5xl text-center text-2xl font-medium text-onboarding-text-100">
        Let{"'"}s secure your instance
      </h1>
      <p className="mt-3 text-center text-sm text-onboarding-text-200">
        Explore privacy options. Get AI features. Secure access.
        <br />
        Takes 2 minutes.
      </p>
      <div className="relative mx-auto mt-5 w-full space-y-4 sm:w-96">
        <Controller
          name="email"
          control={control}
          rules={{
            required: "Email address is required",
            validate: (value) => checkEmailValidity(value) || "Email is invalid",
          }}
          render={({ field: { value, onChange } }) => (
            <div className="relative flex items-center rounded-md bg-onboarding-background-200">
              <Input
                id="email"
                name="email"
                type="email"
                value={value}
                onChange={onChange}
                placeholder="name@company.com"
                className="h-[46px] w-full border border-onboarding-border-100 pr-12 placeholder:text-onboarding-text-400"
              />
              {value.length > 0 && (
                <XCircle
                  className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                  onClick={() => setValue("email", "")}
                />
              )}
            </div>
          )}
        />
        <Controller
          control={control}
          name="password"
          rules={{
            required: "Password is required",
          }}
          render={({ field: { value, onChange } }) => (
            <div className="relative flex items-center rounded-md bg-onboarding-background-200">
              <Input
                type={showPassword ? "text" : "password"}
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.password)}
                placeholder="Enter password"
                className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
              />
              {showPassword ? (
                <EyeOff
                  className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                  onClick={() => setShowPassword(false)}
                />
              ) : (
                <Eye
                  className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                  onClick={() => setShowPassword(true)}
                />
              )}
            </div>
          )}
        />
        <p className="pb-2 text-xs text-custom-text-200">
          Use your email address if you are the instance admin. <br /> Use your admin’s e-mail if you are not.
        </p>
        <Button variant="primary" className="w-full" size="xl" type="submit" loading={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </div>
    </form>
  );
};
