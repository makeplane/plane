/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FormEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
// icons
import { CircleAlert, XCircle } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { IEmailCheckData } from "@plane/types";
import { Spinner } from "@plane/ui";
import { cn, checkEmailValidity } from "@plane/utils";
// helpers
type TAuthEmailForm = {
  defaultEmail: string;
  onSubmit: (data: IEmailCheckData) => Promise<void>;
};

export const AuthEmailForm = observer(function AuthEmailForm(props: TAuthEmailForm) {
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
    <form onSubmit={(e) => void handleFormSubmit(e)} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="block text-[12px] font-semibold text-[#0a1e3f] tracking-wider mb-2 ml-2">
          {t("auth.common.email.label")}
        </label>
        <div
          className={cn(
            `flex items-center bg-[#f4f7f9] border border-transparent rounded-md py-[14px] px-[18px] transition-all duration-200 focus-within:bg-[#ffffff] focus-within:shadow-[0_0_0_3px_rgba(0,112,224,0.1)]`,
            !isFocused && Boolean(emailError?.email) ? `border-red-500` : `focus-within:border-shinhan-blue`
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          <svg
            className="h-5 w-5 text-[#6b7280] mr-3 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.common.email.placeholder")}
            className={`disable-autofill-style bg-transparent w-full text-[#111827] font-semibold placeholder-[#9ca3af] focus:outline-none text-[15px]`}
            autoComplete="off"
            ref={inputRef}
          />
          {email.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setEmail("");
                inputRef.current?.focus();
              }}
              className="ml-2 size-5 grid place-items-center"
              aria-label={t("aria_labels.auth_forms.clear_email")}
              tabIndex={-1}
            >
              <XCircle className="size-5 stroke-[#9ca3af] hover:stroke-[#4b5563]" />
            </button>
          )}
        </div>
        {emailError?.email && !isFocused && (
          <p className="flex items-center gap-1 text-11 text-danger-primary px-0.5">
            <CircleAlert height={12} width={12} />
            {t(emailError.email)}
          </p>
        )}
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isButtonDisabled}
          className="w-full flex justify-center items-center py-[18px] text-white font-semibold text-[16px] tracking-wide rounded-md transition-all duration-200 bg-gradient-to-r from-shinhan-gradientStart via-shinhan-blue to-shinhan-gradientEnd shadow-[0_8px_16px_rgba(0,112,224,0.3)] hover:shadow-[0_10px_20px_rgba(0,112,224,0.4)] hover:-translate-y-[2px] disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_16px_rgba(0,112,224,0.3)]"
        >
          {isSubmitting ? <Spinner height="20px" width="20px" /> : t("common.continue")}
        </button>
      </div>
    </form>
  );
});
