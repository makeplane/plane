/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { CloseCircleOutline, TickCircleOutline } from "@makeplane/propel/icons";
import { InputField } from "@makeplane/propel/components/input-field";
import { API_BASE_URL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
// constants
// helpers
import { EAuthModes } from "@/helpers/authentication.helper";
// hooks
import useTimer from "@/hooks/use-timer";
// services
import { AuthService } from "@/services/auth.service";

// services
const authService = new AuthService();

type TAuthUniqueCodeForm = {
  mode: EAuthModes;
  email: string;
  isExistingEmail: boolean;
  handleEmailClear: () => void;
  generateEmailUniqueCode: (email: string) => Promise<{ code: string } | undefined>;
  nextPath: string | undefined;
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
  const { mode, email, handleEmailClear, generateEmailUniqueCode, nextPath } = props;
  // derived values
  const defaultResetTimerValue = 5;
  // states
  const [uniqueCodeFormData, setUniqueCodeFormData] = useState<TUniqueCodeFormValues>({ ...defaultValues, email });
  const [isRequestingNewCode, setIsRequestingNewCode] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // timer
  const { timer: resendTimerCode, setTimer: setResendCodeTimer } = useTimer(0);
  // plane hooks
  const { t } = useTranslation();

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
      className="space-y-4"
      method="POST"
      action={`${API_BASE_URL}/auth/${mode === EAuthModes.SIGN_IN ? "magic-sign-in" : "magic-sign-up"}/`}
      onSubmit={() => {
        setIsSubmitting(true);
      }}
      onError={() => {
        setIsSubmitting(false);
      }}
    >
      <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
      <input type="hidden" value={uniqueCodeFormData.email} name="email" />
      {nextPath && <input type="hidden" value={nextPath} name="next_path" />}
      <InputField
        size="xl"
        orientation="vertical"
        label={t("auth.common.email.label")}
        id="email"
        name="email"
        type="email"
        value={uniqueCodeFormData.email}
        onChange={(e) => handleFormChange("email", e.target.value)}
        placeholder={t("auth.common.email.placeholder")}
        autoComplete="off"
        disabled
        endIcon={
          uniqueCodeFormData.email.length > 0 && (
            <button
              type="button"
              onClick={handleEmailClear}
              className="grid size-5 shrink-0 place-items-center"
              aria-label={t("aria_labels.auth_forms.clear_email")}
            >
              <CloseCircleOutline className="size-5 text-placeholder" />
            </button>
          )
        }
      />

      <div className="space-y-1">
        <InputField
          size="xl"
          orientation="vertical"
          label={t("auth.common.unique_code.label")}
          name="code"
          id="unique-code"
          aria-describedby="unique-code-hint"
          value={uniqueCodeFormData.code}
          onChange={(e) => handleFormChange("code", e.target.value)}
          placeholder={t("auth.common.unique_code.placeholder")}
          autoComplete="off"
          autoFocus
        />
        <div className="flex w-full items-center justify-between gap-2 px-1 pt-1 text-caption-sm-regular">
          <p id="unique-code-hint" className="flex items-center gap-1 font-medium text-success-primary">
            <TickCircleOutline height={12} width={12} />
            {t("auth.common.unique_code.paste_code")}
          </p>
          <button
            type="button"
            onClick={() => generateNewCode(uniqueCodeFormData.email)}
            className={isRequestNewCodeDisabled ? "text-placeholder" : "font-medium text-accent-secondary"}
            disabled={isRequestNewCodeDisabled}
          >
            {resendTimerCode > 0
              ? t("auth.common.resend_in", { seconds: resendTimerCode })
              : isRequestingNewCode
                ? t("auth.common.unique_code.requesting_new_code")
                : t("common.resend")}
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          stretch="full"
          disabled={isButtonDisabled}
          loading={isSubmitting}
          label={isRequestingNewCode ? t("auth.common.unique_code.sending_code") : t("common.continue")}
        />
      </div>
    </form>
  );
}
