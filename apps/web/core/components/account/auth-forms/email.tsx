"use client";

import { FC, FormEvent, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
// icons
import { CircleAlert, XCircle } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { IEmailCheckData } from "@plane/types";
import { Button, Input, Spinner } from "@plane/ui";
import { cn, checkEmailValidity } from "@plane/utils";
// helpers
type TAuthEmailForm = {
  defaultEmail: string;
  onSubmit: (data: IEmailCheckData) => Promise<void>;
};

export const AuthEmailForm: FC<TAuthEmailForm> = observer((props) => {
  const { onSubmit, defaultEmail } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  // plane hooks
  const { t } = useTranslation();
  const emailError = useMemo(
    () => (email && !checkEmailValidity(email) ? { email: "auth.common.email.errors.invalid" } : undefined),
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
        <label htmlFor="email" className="text-sm text-onboarding-text-300 font-medium">
          {t("auth.common.email.label")}
        </label>
        <div
          className={cn(
            `relative flex items-center rounded-md bg-onboarding-background-200 border`,
            !isFocused && Boolean(emailError?.email) ? `border-red-500` : `border-onboarding-border-100`
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
            placeholder={t("auth.common.email.placeholder")}
            className={`disable-autofill-style h-[46px] w-full placeholder:text-onboarding-text-400 autofill:bg-red-500 border-0 focus:bg-none active:bg-transparent`}
            autoComplete="on"
            autoFocus
            ref={inputRef}
          />
          {email.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setEmail("");
                inputRef.current?.focus();
              }}
              className="absolute right-3 size-5 grid place-items-center"
              aria-label={t("aria_labels.auth_forms.clear_email")}
              tabIndex={-1}
            >
              <XCircle className="size-5 stroke-custom-text-400" />
            </button>
          )}
        </div>
        {emailError?.email && !isFocused && (
          <p className="flex items-center gap-1 text-xs text-red-600 px-0.5">
            <CircleAlert height={12} width={12} />
            {t(emailError.email)}
          </p>
        )}
      </div>
      <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isButtonDisabled}>
        {isSubmitting ? <Spinner height="20px" width="20px" /> : t("common.continue")}
      </Button>
    </form>
  );
});
