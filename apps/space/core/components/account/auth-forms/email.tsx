"use client";

import type { FC, FormEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
// icons
import { CircleAlert, XCircle } from "lucide-react";
// types
import { Button } from "@plane/propel/button";
import type { IEmailCheckData } from "@plane/types";
// ui
import { Input, Spinner } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
import { checkEmailValidity } from "@/helpers/string.helper";

type TAuthEmailForm = {
  defaultEmail: string;
  onSubmit: (data: IEmailCheckData) => Promise<void>;
};

export const AuthEmailForm: FC<TAuthEmailForm> = observer((props) => {
  const { onSubmit, defaultEmail } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState(defaultEmail);

  const emailError = useMemo(
    () => (email && !checkEmailValidity(email) ? { email: "Email is invalid" } : undefined),
    [email]
  );

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const payload: IEmailCheckData = {
      email: email,
    };
    await onSubmit(payload);
    setIsSubmitting(false);
  };

  const isButtonDisabled = email.length === 0 || Boolean(emailError?.email) || isSubmitting;

  const [isFocused, setIsFocused] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
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
          onFocus={() => {
            setIsFocused(true);
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
        >
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className={`disable-autofill-style h-10 w-full placeholder:text-custom-text-400 autofill:bg-red-500 border-0 focus:bg-none active:bg-transparent`}
            autoComplete="on"
            autoFocus
            ref={inputRef}
          />
          {email.length > 0 && (
            <button
              type="button"
              aria-label="Clear email"
              onClick={() => {
                setEmail("");
                inputRef.current?.focus();
              }}
              tabIndex={-1}
            >
              <XCircle className="h-10 w-11 px-3 stroke-custom-text-400 hover:cursor-pointer text-xs" />
            </button>
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
  );
});
