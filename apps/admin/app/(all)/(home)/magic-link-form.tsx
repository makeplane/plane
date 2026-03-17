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

import { useEffect, useRef, useState } from "react";
import { XCircle } from "lucide-react";
// plane internal packages
import { API_BASE_URL } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { AuthService } from "@plane/services";
import { Input, Spinner } from "@plane/ui";

const authService = new AuthService();

type Props = {
  email: string;
  onEmailClear: () => void;
  onSwitchToPassword?: () => void;
};

enum EMagicLinkStep {
  SEND = "SEND",
  CODE = "CODE",
}

export function MagicLinkForm({ email, onEmailClear, onSwitchToPassword }: Props) {
  // ref
  const formRef = useRef<HTMLFormElement>(null);
  // state
  const [step, setStep] = useState<EMagicLinkStep>(EMagicLinkStep.SEND);
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [csrfPromise, setCsrfPromise] = useState<Promise<{ csrf_token: string }> | undefined>(undefined);

  useEffect(() => {
    if (csrfPromise === undefined) {
      const promise = authService.requestCSRFToken();
      setCsrfPromise(promise);
    }
  }, [csrfPromise]);

  const handleSendCode = async () => {
    if (!email.trim()) return;
    setIsSubmitting(true);
    setError(undefined);
    try {
      const response = await fetch(`${API_BASE_URL}/api/instances/admin/magic-generate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
        credentials: "include",
      });
      if (response.ok) {
        setStep(EMagicLinkStep.CODE);
      } else {
        const data = await response.json();
        setError(data?.error_message || "Failed to send magic code. Please try again.");
      }
    } catch {
      setError("Failed to send magic code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCSRFToken = async () => {
    if (!formRef || !formRef.current) return;
    const token = await csrfPromise;
    if (!token?.csrf_token) return;
    const csrfElement = formRef.current.querySelector("input[name=csrfmiddlewaretoken]");
    csrfElement?.setAttribute("value", token?.csrf_token);
  };

  if (step === EMagicLinkStep.SEND) {
    return (
      <div className="space-y-4">
        <div className="w-full space-y-1">
          <label className="text-13 text-tertiary font-medium" htmlFor="magic-email">
            Email <span className="text-danger-primary">*</span>
          </label>
          <div className="relative">
            <Input
              className="w-full border border-subtle !bg-surface-1 placeholder:text-placeholder"
              id="magic-email"
              type="email"
              inputSize="md"
              value={email}
              disabled
            />
            <button
              type="button"
              className="absolute right-3 top-3.5 flex items-center justify-center text-placeholder"
              onClick={onEmailClear}
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-danger-primary">{error}</p>}
        <div className="space-y-2.5">
          <Button type="button" size="xl" className="w-full" disabled={isSubmitting} onClick={handleSendCode}>
            {isSubmitting ? <Spinner height="20px" width="20px" /> : "Send magic code"}
          </Button>
          {onSwitchToPassword && (
            <Button type="button" variant="secondary" size="xl" className="w-full" onClick={onSwitchToPassword}>
              Sign in with password
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-tertiary">
        We sent a code to <span className="font-medium text-primary">{email}</span>
      </p>
      <form
        ref={formRef}
        method="POST"
        action={`${API_BASE_URL}/api/instances/admin/magic-sign-in/`}
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await handleCSRFToken();
          setIsSubmitting(true);
          if (formRef.current) formRef.current.submit();
        }}
        onError={() => setIsSubmitting(false)}
      >
        <input type="hidden" name="csrfmiddlewaretoken" />
        <input type="hidden" name="email" value={email.trim().toLowerCase()} />
        <div className="w-full space-y-1">
          <label className="text-13 text-tertiary font-medium" htmlFor="magic-code">
            Enter code <span className="text-danger-primary">*</span>
          </label>
          <Input
            className="w-full border border-subtle !bg-surface-1 placeholder:text-placeholder"
            id="magic-code"
            name="code"
            type="text"
            inputSize="md"
            placeholder="Enter the code sent to your email"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            autoFocus
          />
        </div>
        {error && <p className="text-sm text-danger-primary">{error}</p>}
        <div className="space-y-2.5">
          <Button type="submit" size="xl" className="w-full" disabled={isSubmitting || !code.trim()}>
            {isSubmitting ? <Spinner height="20px" width="20px" /> : "Verify & sign in"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="xl"
            className="w-full"
            onClick={() => {
              setStep(EMagicLinkStep.SEND);
              setCode("");
              setError(undefined);
            }}
          >
            Go back
          </Button>
        </div>
      </form>
    </div>
  );
}
