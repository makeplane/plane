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

import { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
// icons
import { XCircle } from "lucide-react";
// plane imports
import { API_BASE_URL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input, Spinner } from "@plane/ui";
// services
import { AuthService } from "@/services/auth.service";

type TSSOFormProps = {
  emailParam: string | null;
  nextPath: string | null;
  onBack: () => void;
};

type TSSOFormValues = {
  email: string;
};

const authService = new AuthService();

export const SSOForm = observer(function SSOForm(props: TSSOFormProps) {
  const { emailParam, nextPath, onBack } = props;
  // plane imports
  const { t } = useTranslation();
  // ref
  const formRef = useRef<HTMLFormElement>(null);
  // states
  const [csrfPromise, setCsrfPromise] = useState<Promise<{ csrf_token: string }> | undefined>(undefined);
  const [ssoFormData, setSsoFormData] = useState<TSSOFormValues>({ email: emailParam || "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormChange = (key: keyof TSSOFormValues, value: string) =>
    setSsoFormData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (csrfPromise === undefined) {
      const promise = authService.requestCSRFToken();
      setCsrfPromise(promise);
    }
  }, [csrfPromise]);

  const isButtonDisabled = useMemo(
    () => (!isSubmitting && !!ssoFormData.email ? false : true),
    [isSubmitting, ssoFormData]
  );

  const handleCSRFToken = async () => {
    if (!formRef || !formRef.current) return;
    const token = await csrfPromise;
    if (!token?.csrf_token) return;
    const csrfElement = formRef.current.querySelector("input[name=csrfmiddlewaretoken]");
    csrfElement?.setAttribute("value", token?.csrf_token);
  };

  return (
    <form
      ref={formRef}
      className="space-y-4"
      method="POST"
      action={`${API_BASE_URL}/auth/sso/`}
      onSubmit={async (event) => {
        event.preventDefault();
        await handleCSRFToken();
        setIsSubmitting(true);
        if (formRef.current) formRef.current.submit();
      }}
      onError={() => {
        setIsSubmitting(false);
      }}
    >
      <input type="hidden" name="csrfmiddlewaretoken" />
      {nextPath && <input type="hidden" value={nextPath} name="next_path" />}
      <div className="space-y-1">
        <label htmlFor="email" className="text-13 font-medium text-tertiary">
          {t("auth.common.email.label")}
        </label>
        <div className={`relative flex items-center rounded-md bg-surface-1 border border-strong`}>
          <Input
            id="email"
            name="email"
            value={ssoFormData.email}
            onChange={(e) => handleFormChange("email", e.target.value)}
            placeholder={t("auth.common.email.placeholder")}
            className="disable-autofill-style h-10 w-full"
          />
          {ssoFormData.email.length > 0 && (
            <button
              type="button"
              className="absolute right-3 size-5"
              onClick={() => handleFormChange("email", "")}
              aria-label={t("aria_labels.auth_forms.clear_email")}
            >
              <XCircle className="size-5 stroke-placeholder" />
            </button>
          )}
        </div>
      </div>
      <div className="space-y-2.5">
        <Button type="submit" variant="primary" className="w-full" size="xl" disabled={isButtonDisabled}>
          {isSubmitting ? <Spinner height="20px" width="20px" /> : t("common.continue")}
        </Button>
        <Button type="button" variant="secondary" className="w-full" size="xl" onClick={onBack}>
          {t("common.go_back")}
        </Button>
      </div>
    </form>
  );
});
