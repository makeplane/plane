"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
// icons
import { CircleCheck, XCircle } from "lucide-react";
// ui
import { Button, Input, Spinner } from "@plane/ui";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// hooks
import useTimer from "@/hooks/use-timer";
import useToast from "@/hooks/use-toast";
// services
import { AuthService } from "@/services/auth.service";
// types
import { IEmailCheckData } from "@/types/auth";
import { EAuthModes } from "./root";

type Props = {
  email: string;
  mode: EAuthModes;
  handleEmailClear: () => void;
  submitButtonText: string;
};

type TUniqueCodeFormValues = {
  email: string;
  code: string;
};

const defaultValues: TUniqueCodeFormValues = {
  email: "",
  code: "",
};

// services
const authService = new AuthService();

export const UniqueCodeForm: React.FC<Props> = (props) => {
  const { email, mode, handleEmailClear, submitButtonText } = props;
  // states
  const [uniqueCodeFormData, setUniqueCodeFormData] = useState<TUniqueCodeFormValues>({ ...defaultValues, email });
  const [isRequestingNewCode, setIsRequestingNewCode] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // router
  const { next_path } = useParams<any>();
  // toast alert
  const { setToastAlert } = useToast();
  // timer
  const { timer: resendTimerCode, setTimer: setResendCodeTimer } = useTimer(30);

  const handleFormChange = (key: keyof TUniqueCodeFormValues, value: string) =>
    setUniqueCodeFormData((prev) => ({ ...prev, [key]: value }));

  const handleSendNewCode = async (email: string) => {
    const payload: IEmailCheckData = {
      email,
    };

    await authService
      .generateUniqueCode(payload)
      .then(() => {
        setResendCodeTimer(30);
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "A new unique code has been sent to your email.",
        });
        handleFormChange("code", "");
      })
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        })
      );
  };

  const handleRequestNewCode = async () => {
    setIsRequestingNewCode(true);

    await handleSendNewCode(uniqueCodeFormData.email)
      .then(() => setResendCodeTimer(30))
      .finally(() => setIsRequestingNewCode(false));
  };

  useEffect(() => {
    if (csrfToken === undefined)
      authService.requestCSRFToken().then((data) => data?.csrf_token && setCsrfToken(data.csrf_token));
  }, [csrfToken]);

  useEffect(() => {
    setIsRequestingNewCode(true);
    handleSendNewCode(email)
      .then(() => setResendCodeTimer(30))
      .finally(() => setIsRequestingNewCode(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <input type="hidden" name="next_path" value={next_path} />
      <div className="space-y-1">
        <label className="text-sm font-medium text-onboarding-text-300" htmlFor="email">
          Email
        </label>
        <div className="relative flex items-center rounded-md bg-onboarding-background-200">
          <Input
            id="email"
            name="email"
            type="email"
            value={uniqueCodeFormData.email}
            onChange={(e) => handleFormChange("email", e.target.value)}
            // FIXME:
            // hasError={Boolean(errors.email)}
            placeholder="name@company.com"
            className="h-[46px] w-full border border-onboarding-border-100 pr-12 placeholder:text-onboarding-text-400"
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
          // FIXME:
          // hasError={Boolean(errors.code)}
          placeholder="gets-sets-flys"
          className="h-[46px] w-full border border-onboarding-border-100 !bg-onboarding-background-200 pr-12 placeholder:text-onboarding-text-400"
          autoFocus
          autoComplete="off"
        />
        <div className="flex w-full items-center justify-between px-1 text-xs">
          <p className="flex items-center gap-1 font-medium text-green-700">
            <CircleCheck height={12} width={12} />
            Paste the code sent to your email
          </p>
          <button
            type="button"
            onClick={handleRequestNewCode}
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
      <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isButtonDisabled}>
        {isRequestingNewCode ? (
          "Sending code"
        ) : isSubmitting ? (
          <Spinner height="20px" width="20px" />
        ) : (
          submitButtonText
        )}
      </Button>
    </form>
  );
};
