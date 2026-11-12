/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FormEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
// icons
import { CloseCircleOutline, WarningCircleOutline } from "@makeplane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { InputField } from "@makeplane/propel/components/input-field";
import type { IEmailCheckData } from "@plane/types";
import { checkEmailValidity } from "@plane/utils";
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
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <InputField
        size="xl"
        orientation="vertical"
        label={t("auth.common.email.label")}
        id="email"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={t("auth.common.email.placeholder")}
        autoComplete="off"
        autoFocus
        ref={inputRef}
        endIcon={
          email.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setEmail("");
                inputRef.current?.focus();
              }}
              className="grid size-5 shrink-0 place-items-center"
              aria-label={t("aria_labels.auth_forms.clear_email")}
              tabIndex={-1}
            >
              <CloseCircleOutline className="size-5 text-placeholder" />
            </button>
          )
        }
        error={
          emailError?.email && !isFocused ? (
            <span className="flex items-center gap-1">
              <WarningCircleOutline height={12} width={12} />
              {t(emailError.email)}
            </span>
          ) : undefined
        }
      />
      <Button
        type="submit"
        variant="primary"
        size="lg"
        stretch="full"
        disabled={isButtonDisabled}
        loading={isSubmitting}
        label={t("common.continue")}
      />
    </form>
  );
});
