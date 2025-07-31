"use client";

import { FC, FormEvent, useMemo, useRef, useState } from "react";
import { CircleAlert, XCircle } from "lucide-react";
import {
  EMobileAuthSteps,
  EMobileAuthModes,
  TMobileAuthSteps,
  TMobileAuthModes,
  TMobileAuthErrorInfo,
} from "@plane/constants";
import { IEmailCheckData } from "@plane/types";
import { Button, Input, Spinner } from "@plane/ui";
import { checkEmailValidity, cn } from "@plane/utils";
// helpers
import { authErrorHandler } from "@/helpers/authentication.helper";
// plane web services
import mobileAuthService from "@/plane-web/services/mobile.service";

type TMobileAuthEmailValidationForm = {
  email: string;
  handleEmail: (value: string) => void;
  handleAuthStep: (value: TMobileAuthSteps) => void;
  handleAuthMode: (value: TMobileAuthModes) => void;
  handleErrorInfo: (value: TMobileAuthErrorInfo | undefined) => void;
  generateEmailUniqueCode: (email: string) => Promise<{ code: string } | undefined>;
};

export const MobileAuthEmailValidationForm: FC<TMobileAuthEmailValidationForm> = (props) => {
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
          <label className="text-sm text-custom-text-300 font-medium" htmlFor="email">
            Email
          </label>
          <div
            className={cn(
              `relative flex items-center rounded-md bg-custom-background-100 border`,
              !isFocused && Boolean(emailError?.email) ? `border-red-500` : `border-custom-border-100`
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
              className={`disable-autofill-style h-[46px] w-full placeholder:text-custom-text-400 autofill:bg-red-500 border-0 focus:bg-none active:bg-transparent`}
              autoComplete="on"
              autoFocus
              ref={inputRef}
            />
            {email.length > 0 && (
              <XCircle
                className="h-[46px] w-11 px-3 stroke-custom-text-400 hover:cursor-pointer text-xs"
                onClick={() => {
                  setEmail("");
                  inputRef.current?.focus();
                }}
              />
            )}
          </div>
          {emailError?.email && !isFocused && (
            <p className="flex items-center gap-1 text-xs text-red-600 px-0.5">
              <CircleAlert height={12} width={12} />
              {emailError.email}
            </p>
          )}
        </div>
        <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isButtonDisabled}>
          {isSubmitting ? <Spinner height="20px" width="20px" /> : "Continue"}
        </Button>
      </form>
    </div>
  );
};
