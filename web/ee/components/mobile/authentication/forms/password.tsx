"use client";

import { FC, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Eye, EyeOff, XCircle } from "lucide-react";
import { Button, Input, Spinner } from "@plane/ui";
// helpers
import { EAuthSteps } from "@/helpers/authentication.helper";
import { API_BASE_URL } from "@/helpers/common.helper";
// hooks
import { useInstance } from "@/hooks/store";
// services
import { AuthService } from "@/services/auth.service";

const authService = new AuthService();

type TMobileAuthPasswordForm = {
  email: string;
  handleEmail: (value: string) => void;
  handleAuthStep: (value: EAuthSteps) => void;
  generateEmailUniqueCode: (email: string) => Promise<{ code: string } | undefined>;
};

type TFormValues = {
  email: string;
  password: string;
};

const defaultFormValues: TFormValues = {
  email: "",
  password: "",
};

export const MobileAuthPasswordForm: FC<TMobileAuthPasswordForm> = observer((props) => {
  const { email, handleEmail, handleAuthStep, generateEmailUniqueCode } = props;
  // ref
  const authFormRef = useRef<HTMLFormElement>(null);
  // hooks
  const { config } = useInstance();
  // states
  const [csrfPromise, setCsrfPromise] = useState<Promise<{ csrf_token: string }> | undefined>(undefined);
  const [formData, setFormData] = useState<TFormValues>({ ...defaultFormValues, email });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // derived values
  const isSMTPConfigured = config?.is_smtp_configured || false;
  const isButtonDisabled = formData.password.length === 0 || isSubmitting;

  useEffect(() => {
    if (csrfPromise === undefined) {
      const promise = authService.requestCSRFToken();
      setCsrfPromise(promise);
    }
  }, [csrfPromise]);

  const handleFormChange = (key: keyof TFormValues, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleShowPassword = () => setShowPassword((prev) => !prev);

  const handleCSRFToken = async () => {
    if (!authFormRef || !authFormRef.current) return;
    const token = await csrfPromise;
    if (!token?.csrf_token) return;
    const csrfElement = authFormRef.current.querySelector("input[name=csrfmiddlewaretoken]");
    csrfElement?.setAttribute("value", token?.csrf_token);
  };

  const handleEmailClear = () => {
    handleEmail("");
    handleAuthStep(EAuthSteps.EMAIL);
  };

  const redirectToUniqueCodeSignIn = () => {
    handleAuthStep(EAuthSteps.UNIQUE_CODE);
    // generate unique code
    generateEmailUniqueCode(email);
  };

  return (
    <form
      ref={authFormRef}
      className="mt-5 space-y-4"
      method="POST"
      action={`${API_BASE_URL}/auth/mobile/sign-in/`}
      onSubmit={async (event) => {
        event.preventDefault(); // Prevent form from submitting by default
        setIsSubmitting(true);
        await handleCSRFToken();
        authFormRef.current && authFormRef.current.submit();
      }}
      onError={() => setIsSubmitting(false)}
    >
      <input type="hidden" name="csrfmiddlewaretoken" />
      <input type="hidden" value={formData.email} name="email" />

      <div className="space-y-1">
        <label className="text-sm font-medium text-onboarding-text-300" htmlFor="email">
          Email
        </label>
        <div
          className={`relative flex items-center rounded-md bg-onboarding-background-200 border border-onboarding-border-100`}
        >
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleFormChange("email", e.target.value)}
            placeholder="name@company.com"
            className={`disable-autofill-style h-[46px] w-full placeholder:text-onboarding-text-400 border-0`}
            disabled
          />
          {formData.email.length > 0 && (
            <XCircle
              className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
              onClick={handleEmailClear}
            />
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="password">
          Password
        </label>
        <div className="relative flex items-center rounded-md bg-onboarding-background-200">
          <Input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={(e) => handleFormChange("password", e.target.value)}
            placeholder="Enter password"
            className="disable-autofill-style h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
            autoComplete="on"
            autoFocus
          />
          {showPassword ? (
            <EyeOff
              className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
              onClick={() => handleShowPassword()}
            />
          ) : (
            <Eye
              className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
              onClick={() => handleShowPassword()}
            />
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isButtonDisabled}>
          {isSubmitting ? <Spinner height="20px" width="20px" /> : isSMTPConfigured ? "Continue" : "Go to workspace"}
        </Button>

        {isSMTPConfigured && (
          <Button
            type="button"
            onClick={redirectToUniqueCodeSignIn}
            variant="outline-primary"
            className="w-full"
            size="lg"
          >
            Sign in with unique code
          </Button>
        )}
      </div>
    </form>
  );
});
