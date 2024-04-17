import React, { useState } from "react";
import { observer } from "mobx-react";
// icons
import { Eye, EyeOff, XCircle } from "lucide-react";
// ui
import { Button, Input } from "@plane/ui";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// components
import { PasswordStrengthMeter } from "../password-strength-meter";

type Props = {
  email: string;
  handleEmailClear: () => void;
  onSubmit: () => Promise<void>;
};

type TPasswordFormValues = {
  email: string;
  password: string;
};

const defaultValues: TPasswordFormValues = {
  email: "",
  password: "",
};

export const SignUpPasswordForm: React.FC<Props> = observer((props) => {
  const { email, handleEmailClear, onSubmit } = props;
  // states
  const [passwordFormData, setPasswordFormData] = useState<TPasswordFormValues>({ ...defaultValues, email });
  const [showPassword, setShowPassword] = useState(false);

  const handleFormChange = (key: keyof TPasswordFormValues, value: string) =>
    setPasswordFormData((prev) => ({ ...prev, [key]: value }));

  // const handleFormSubmit = async (formData: TPasswordFormValues) => {
  //   const payload: IPasswordSignInData = {
  //     email: formData.email,
  //     password: formData.password,
  //   };

  //   await authService
  //     .passwordSignIn(payload)
  //     .then(async () => await onSubmit())
  //     .catch((err) =>
  //       setToast({
  //         type: TOAST_TYPE.ERROR,
  //         title: "Error!",
  //         message: err?.error ?? "Something went wrong. Please try again.",
  //       })
  //     );
  // };

  return (
    <>
      <div className="text-center space-y-1 py-4 mx-auto sm:w-96">
        <h3 className="text-3xl font-bold text-onboarding-text-100">Create your account</h3>
        <p className="font-medium text-onboarding-text-400">
          Progress, visualize, and measure work how it works best for you.
        </p>
      </div>
      <form
        className="mx-auto mt-5 space-y-4 sm:w-96"
        method="POST"
        action={`${API_BASE_URL}/api/instances/admins/sign-up/`}
      >
        <div className="space-y-1">
          <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="email">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative flex items-center rounded-md bg-onboarding-background-200">
            <Input
              id="email"
              name="email"
              type="email"
              value={passwordFormData.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
              // hasError={Boolean(errors.email)}
              placeholder="name@company.com"
              className="h-[46px] w-full border border-onboarding-border-100 pr-12 placeholder:text-onboarding-text-400"
              disabled
            />
            {passwordFormData.email.length > 0 && (
              <XCircle
                className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
                onClick={handleEmailClear}
              />
            )}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="password">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative flex items-center rounded-md bg-onboarding-background-200">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              value={passwordFormData.password}
              onChange={(e) => handleFormChange("password", e.target.value)}
              // hasError={Boolean(errors.password)}
              placeholder="Enter password"
              className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
              autoFocus
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
          <PasswordStrengthMeter password={passwordFormData.password} />
        </div>
        {/* <Button type="submit" variant="primary" className="w-full" size="lg" disabled={!isValid} loading={isSubmitting}> */}
        <Button type="submit" variant="primary" className="w-full" size="lg">
          Create account
        </Button>
      </form>
    </>
  );
});
