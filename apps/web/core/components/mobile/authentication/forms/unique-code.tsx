/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { CircleCheck, XCircle } from "lucide-react";
// plane imports
import type { TMobileAuthSteps, TMobileAuthModes } from "@plane/constants";
import { EMobileAuthSteps, EMobileAuthModes, API_BASE_URL } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { Input, Spinner } from "@plane/ui";
// hooks
import useTimer from "@/hooks/use-timer";
// services
import mobileAuthService from "@/services/mobile.service";

type TMobileAuthUniqueCodeForm = {
  authMode: TMobileAuthModes;
  invitationId: string | undefined;
  email: string;
  handleEmail: (value: string) => void;
  handleAuthStep: (value: TMobileAuthSteps) => void;
  generateEmailUniqueCode: (email: string) => Promise<{ code: string } | undefined>;
};

type TFormValues = {
  email: string;
  code: string;
};

const defaultFormValues: TFormValues = {
  email: "",
  code: "",
};

const defaultResetTimerValue = 5;

export function MobileAuthUniqueCodeForm(props: TMobileAuthUniqueCodeForm) {
  const { authMode, invitationId, email, handleEmail, handleAuthStep, generateEmailUniqueCode } = props;
  // ref
  const authFormRef = useRef<HTMLFormElement>(null);
  // hooks
  const { timer: resendTimerCode, setTimer: setResendCodeTimer } = useTimer(0);
  // states
  const [csrfPromise, setCsrfPromise] = useState<Promise<{ csrf_token: string }> | undefined>(undefined);
  const [formData, setFormData] = useState<TFormValues>({ ...defaultFormValues, email });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingNewCode, setIsRequestingNewCode] = useState(false);
  // derived values
  const isRequestNewCodeDisabled = isRequestingNewCode || resendTimerCode > 0;
  const isButtonDisabled = isRequestingNewCode || !formData.code || isSubmitting;

  useEffect(() => {
    if (csrfPromise === undefined) {
      const promise = mobileAuthService.requestCSRFToken();
      setCsrfPromise(promise);
    }
  }, [csrfPromise]);

  // handlers
  const handleFormChange = (key: keyof TFormValues, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleCSRFToken = async () => {
    if (!authFormRef || !authFormRef.current) return;
    const token = await csrfPromise;
    if (!token?.csrf_token) return;
    const csrfElement = authFormRef.current.querySelector("input[name=csrfmiddlewaretoken]");
    csrfElement?.setAttribute("value", token?.csrf_token);
  };

  const generateNewEmailUniqueCode = async (email: string) => {
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

  const handleEmailClear = () => {
    handleEmail("");
    handleAuthStep(EMobileAuthSteps.EMAIL);
  };

  return (
    <form
      ref={authFormRef}
      className="mt-5 space-y-4"
      method="POST"
      action={`${API_BASE_URL}/auth/mobile/${authMode === EMobileAuthModes.SIGN_UP ? "magic-sign-up" : "magic-sign-in"}/`}
      onSubmit={async (event) => {
        event.preventDefault(); // Prevent form from submitting by default
        setIsSubmitting(true);
        await handleCSRFToken();
        if (authFormRef.current) authFormRef.current.submit();
      }}
    >
      <input type="hidden" name="csrfmiddlewaretoken" />
      <input type="hidden" value={formData.email} name="email" />
      <input type="hidden" value={invitationId} name="invitation_id" />
      <div className="space-y-1">
        <label className="text-13 font-medium text-tertiary" htmlFor="email">
          Email
        </label>
        <div className={`relative flex items-center rounded-md bg-surface-1 border border-subtle`}>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleFormChange("email", e.target.value)}
            placeholder="name@company.com"
            className={`disable-autofill-style h-10 w-full placeholder:text-placeholder border-0`}
            disabled
          />
          {formData.email.length > 0 && (
            <XCircle
              className="absolute right-3 h-5 w-5 stroke-placeholder hover:cursor-pointer"
              onClick={handleEmailClear}
            />
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-13 text-tertiary font-medium" htmlFor="code">
          Unique code
        </label>
        <div className="relative flex items-center rounded-md bg-surface-1">
          <Input
            type={"text"}
            name="code"
            value={formData.code}
            onChange={(e) => handleFormChange("code", e.target.value)}
            placeholder="123456"
            className="disable-autofill-style h-10 w-full border border-subtle bg-surface-1! pr-12 placeholder:text-placeholder"
            autoComplete="on"
            autoFocus
          />
        </div>
        <div className="flex w-full items-center justify-between px-1 text-11 pt-1">
          <p className="flex items-center gap-1 font-medium text-success-primary">
            <CircleCheck height={12} width={12} />
            Paste the code sent to your email
          </p>
          <button
            type="button"
            onClick={() => generateNewEmailUniqueCode(email)}
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
