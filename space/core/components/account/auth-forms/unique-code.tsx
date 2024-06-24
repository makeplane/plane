"use client";

import React, { useEffect, useState } from "react";
import { CircleCheck, XCircle } from "lucide-react";
import { Button, Input, Spinner } from "@plane/ui";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// hooks
import useTimer from "@/hooks/use-timer";
// services
import { AuthService } from "@/services/auth.service";
// types
import { EAuthModes } from "@/types/auth";

// services
const authService = new AuthService();

type TAuthUniqueCodeForm = {
  mode: EAuthModes;
  email: string;
  nextPath: string | undefined;
  handleEmailClear: () => void;
  generateEmailUniqueCode: (email: string) => Promise<{ code: string } | undefined>;
};

type TUniqueCodeFormValues = {
  email: string;
  code: string;
};

const defaultValues: TUniqueCodeFormValues = {
  email: "",
  code: "",
};

export const AuthUniqueCodeForm: React.FC<TAuthUniqueCodeForm> = (props) => {
  const { mode, email, nextPath, handleEmailClear, generateEmailUniqueCode } = props;
  // hooks
  // const { captureEvent } = useEventTracker();
  // derived values
  const defaultResetTimerValue = 5;
  // states
  const [uniqueCodeFormData, setUniqueCodeFormData] = useState<TUniqueCodeFormValues>({ ...defaultValues, email });
  const [isRequestingNewCode, setIsRequestingNewCode] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // timer
  const { timer: resendTimerCode, setTimer: setResendCodeTimer } = useTimer(0);

  const handleFormChange = (key: keyof TUniqueCodeFormValues, value: string) =>
    setUniqueCodeFormData((prev) => ({ ...prev, [key]: value }));

  const generateNewCode = async (email: string) => {
    try {
      setIsRequestingNewCode(true);
      const uniqueCode = await generateEmailUniqueCode(email);
      setResendCodeTimer(defaultResetTimerValue);
      handleFormChange("code", uniqueCode?.code || "");
      setIsRequestingNewCode(false);
    } catch {
      setResendCodeTimer(0);
      console.error("Error while requesting new code");
      setIsRequestingNewCode(false);
    }
  };

  useEffect(() => {
    if (csrfToken === undefined)
      authService.requestCSRFToken().then((data) => data?.csrf_token && setCsrfToken(data.csrf_token));
  }, [csrfToken]);

  const isRequestNewCodeDisabled = isRequestingNewCode || resendTimerCode > 0;
  const isButtonDisabled = isRequestingNewCode || !uniqueCodeFormData.code || isSubmitting;

  return (
    <form
      className="mt-5 space-y-4"
      method="POST"
      action={`${API_BASE_URL}/auth/spaces/${mode === EAuthModes.SIGN_IN ? "magic-sign-in" : "magic-sign-up"}/`}
      onSubmit={() => setIsSubmitting(true)}
      onError={() => setIsSubmitting(false)}
    >
      <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
      <input type="hidden" value={uniqueCodeFormData.email} name="email" />
      <input type="hidden" value={nextPath} name="next_path" />
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
            value={uniqueCodeFormData.email}
            onChange={(e) => handleFormChange("email", e.target.value)}
            placeholder="name@company.com"
            className={`disable-autofill-style h-[46px] w-full placeholder:text-onboarding-text-400 border-0`}
            disabled
          />
          {uniqueCodeFormData.email.length > 0 && (
            <XCircle
              className="absolute right-3 h-5 w-5 stroke-custom-text-400 hover:cursor-pointer"
              onClick={handleEmailClear}
            />
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-onboarding-text-300" htmlFor="code">
          Unique code
        </label>
        <Input
          name="code"
          value={uniqueCodeFormData.code}
          onChange={(e) => handleFormChange("code", e.target.value)}
          placeholder="gets-sets-flys"
          className="disable-autofill-style h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
          autoFocus
        />
        <div className="flex w-full items-center justify-between px-1 text-xs pt-1">
          <p className="flex items-center gap-1 font-medium text-green-700">
            <CircleCheck height={12} width={12} />
            Paste the code sent to your email
          </p>
          <button
            type="button"
            onClick={() => generateNewCode(uniqueCodeFormData.email)}
            className={`${
              isRequestNewCodeDisabled
                ? "text-onboarding-text-400"
                : "font-medium text-custom-primary-300 hover:text-custom-primary-200"
            }`}
            disabled={isRequestNewCodeDisabled}
          >
            {resendTimerCode > 0
              ? `Resend in ${resendTimerCode}s`
              : isRequestingNewCode
                ? "Requesting new code"
                : "Resend"}
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isButtonDisabled}>
          {isRequestingNewCode ? "Sending code" : isSubmitting ? <Spinner height="20px" width="20px" /> : "Continue"}
        </Button>
      </div>
    </form>
  );
};
