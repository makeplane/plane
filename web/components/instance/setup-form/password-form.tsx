import React from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
// ui
import { Input, Button } from "@plane/ui";
// icons
import { XCircle } from "lucide-react";
// services
import { AuthService } from "services/auth.service";
const authService = new AuthService();

export interface InstanceSetupPasswordFormValues {
  email: string;
  password: string;
}

export interface IInstanceSetupPasswordForm {
  email: string;
  onNextStep: () => void;
  resetSteps: () => void;
}

export const InstanceSetupPasswordForm: React.FC<IInstanceSetupPasswordForm> = (props) => {
  const { onNextStep, email, resetSteps } = props;
  // form info
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InstanceSetupPasswordFormValues>({
    defaultValues: {
      email,
      password: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const handlePasswordSubmit = (formData: InstanceSetupPasswordFormValues) =>
    authService.setInstanceAdminPassword({ password: formData.password }).then(() => {
      onNextStep();
    });

  return (
    <form onSubmit={handleSubmit(handlePasswordSubmit)}>
      <div className="pb-2">
        <h1 className="text-center text-2xl sm:text-2.5xl font-medium text-onboarding-text-100">
          Moving to the runway
        </h1>
        <p className="text-center text-sm text-onboarding-text-200 mt-3">
          Let{"'"}s set a password so you can do away with codes.
        </p>

        <div className="relative mt-5 w-full sm:w-96 mx-auto space-y-4">
          <Controller
            control={control}
            name="email"
            rules={{
              required: "Email is required",
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
                <XCircle
                  className="h-5 w-5 absolute stroke-custom-text-400 hover:cursor-pointer right-3"
                  onClick={() => resetSteps()}
                />
              </div>
            )}
          />
          <div>
            <Controller
              control={control}
              name="password"
              rules={{
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Minimum 8 characters required",
                },
              }}
              render={({ field: { value, onChange } }) => (
                <div className={`flex items-center relative rounded-md bg-onboarding-background-200`}>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    value={value}
                    onChange={onChange}
                    hasError={Boolean(errors.password)}
                    placeholder="Enter your password..."
                    className="w-full h-[46px] placeholder:text-onboarding-text-400 border border-onboarding-border-100 pr-12"
                  />
                </div>
              )}
            />
            <p className="text-xs mt-3 text-onboarding-text-200 pb-2">
              Whatever you choose now will be your account{"'"}s password
            </p>
          </div>
          <Button variant="primary" className="w-full mt-4" size="xl" type="submit" loading={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Next step"}
          </Button>
          <p className="text-xs text-onboarding-text-200">
            When you click the button above, you agree with our{" "}
            <Link href="https://plane.so/terms-and-conditions" target="_blank" rel="noopener noreferrer">
              <span className="font-semibold underline">terms and conditions of service.</span>
            </Link>
          </p>
        </div>
      </div>
    </form>
  );
};
