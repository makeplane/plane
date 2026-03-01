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

import type { FC, FormEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { CircleAlert, XCircle } from "lucide-react";
import type { TMobileAuthSteps, TMobileAuthModes, TMobileAuthErrorInfo } from "@plane/constants";
import { EMobileAuthSteps, EMobileAuthModes } from "@plane/constants";
import { Button } from "@plane/propel/button";
import type { IEmailCheckData } from "@plane/types";
import { Input, Spinner } from "@plane/ui";
import { checkEmailValidity, cn } from "@plane/utils";
// helpers
import { authErrorHandler } from "@/helpers/authentication.helper";
// plane web services
import mobileAuthService from "@/services/mobile.service";

type TMobileAuthEmailValidationForm = {
  email: string;
  handleEmail: (value: string) => void;
  handleAuthStep: (value: TMobileAuthSteps) => void;
  handleAuthMode: (value: TMobileAuthModes) => void;
  handleErrorInfo: (value: TMobileAuthErrorInfo | undefined) => void;
  generateEmailUniqueCode: (email: string) => Promise<{ code: string } | undefined>;
};

export function MobileAuthEmailValidationForm(props: TMobileAuthEmailValidationForm) {
  const {
    email: defaultEmail,
    handleEmail,
    handleAuthStep,
    handleAuthMode,
    handleErrorInfo,
    generateEmailUniqueCode,
  } = props;
  // ref
  const inputRef = useRef<HTMLInputElement>(null);

  // state
  const [isFocused, setIsFocused] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState(defaultEmail);

  // derived values
  const emailError = useMemo(
    () => (email && !checkEmailValidity(email) ? { email: "Email is invalid" } : undefined),
    [email]
  );
  const isButtonDisabled = email.length === 0 || Boolean(emailError?.email) || isSubmitting;

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    handleEmail(email);
    setIsSubmitting(true);

    let userExists = false;
    let userCanAuthenticate = true;

    try {
      await mobileAuthService.currentUser();
      userExists = true;
    } catch {
      userExists = false;
    }

    if (userExists) {
      try {
        await mobileAuthService.signOut();
        userCanAuthenticate = true;
      } catch {
        userCanAuthenticate = false;
      }
    }

    if (!userCanAuthenticate) {
      setIsSubmitting(false);
      return;
    }

    const payload: IEmailCheckData = {
      email: email,
    };

    await mobileAuthService
      .emailCheck(payload)
      .then(async (response) => {
        // setting auth mode
        if (response.existing) {
          handleAuthMode(EMobileAuthModes.SIGN_IN);
        } else {
          handleAuthMode(EMobileAuthModes.SIGN_UP);
        }

        // setting auth step
        if (response.status === "MAGIC_CODE") {
          handleAuthStep(EMobileAuthSteps.UNIQUE_CODE);
          // generating unique code
          generateEmailUniqueCode(email);
        } else if (response.status === "CREDENTIAL") {
          handleAuthStep(EMobileAuthSteps.PASSWORD);
        }
      })
      .catch((error) => {
        const errorhandler = authErrorHandler(error?.error_code?.toString(), email || undefined);
        if (errorhandler?.type) handleErrorInfo(errorhandler);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div>
      <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
        <div className="space-y-1">
          <label className="text-13 text-tertiary font-medium" htmlFor="email">
            Email
          </label>
          <div
            className={cn(
              `relative flex items-center rounded-md bg-surface-1 border`,
              !isFocused && Boolean(emailError?.email) ? `border-danger-strong` : `border-subtle`
            )}
            tabIndex={-1}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          >
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className={`disable-autofill-style h-10 w-full placeholder:text-placeholder autofill:bg-danger-primary border-0 focus:bg-none active:bg-transparent`}
              autoComplete="on"
              autoFocus
              ref={inputRef}
            />
            {email.length > 0 && (
              <XCircle
                className="h-10 w-11 px-3 stroke-placeholder hover:cursor-pointer text-11"
                onClick={() => {
                  setEmail("");
                  inputRef.current?.focus();
                }}
              />
            )}
          </div>
          {emailError?.email && !isFocused && (
            <p className="flex items-center gap-1 text-11 text-danger-primary px-0.5">
              <CircleAlert height={12} width={12} />
              {emailError.email}
            </p>
          )}
        </div>
        <Button type="submit" variant="primary" className="w-full" size="xl" disabled={isButtonDisabled}>
          {isSubmitting ? <Spinner height="20px" width="20px" /> : "Continue"}
        </Button>
      </form>
    </div>
  );
}
