import React, { useEffect, useState } from "react";
import { CircleCheck, XCircle } from "lucide-react";
// plane imports
import { API_BASE_URL } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { AuthService } from "@plane/services";
import { Input, Spinner } from "@plane/ui";
// hooks
import useTimer from "@/hooks/use-timer";
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

export function AuthUniqueCodeForm(props: TAuthUniqueCodeForm) {
  const { mode, email, nextPath, handleEmailClear, generateEmailUniqueCode } = props;
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
        <label className="text-13 font-medium text-tertiary" htmlFor="email">
          Email
        </label>
        <div className={`relative flex items-center rounded-md bg-surface-1 border border-subtle`}>
          <Input
            id="email"
            name="email"
            type="email"
            value={uniqueCodeFormData.email}
            onChange={(e) => handleFormChange("email", e.target.value)}
            placeholder="name@company.com"
            className={`disable-autofill-style h-10 w-full placeholder:text-placeholder border-0`}
            disabled
          />
          {uniqueCodeFormData.email.length > 0 && (
            <XCircle
              className="absolute right-3 h-5 w-5 stroke-placeholder hover:cursor-pointer"
              onClick={handleEmailClear}
            />
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-13 font-medium text-tertiary" htmlFor="code">
          Unique code
        </label>
        <Input
          name="code"
          value={uniqueCodeFormData.code}
          onChange={(e) => handleFormChange("code", e.target.value)}
          placeholder="123456"
          className="disable-autofill-style h-10 w-full border border-subtle !bg-surface-1 pr-12 placeholder:text-placeholder"
          autoFocus
        />
        <div className="flex w-full items-center justify-between px-1 text-11 pt-1">
          <p className="flex items-center gap-1 font-medium text-success-primary">
            <CircleCheck height={12} width={12} />
            Paste the code sent to your email
          </p>
          <button
            type="button"
            onClick={() => generateNewCode(uniqueCodeFormData.email)}
            className={`${
              isRequestNewCodeDisabled
                ? "text-placeholder"
                : "font-medium text-accent-secondary hover:text-accent-secondary"
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
        <Button type="submit" variant="primary" className="w-full" size="xl" disabled={isButtonDisabled}>
          {isRequestingNewCode ? "Sending code" : isSubmitting ? <Spinner height="20px" width="20px" /> : "Continue"}
        </Button>
      </div>
    </form>
  );
}
