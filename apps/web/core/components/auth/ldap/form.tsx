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
import { Eye, EyeOff, XCircle } from "lucide-react";
// plane imports
import { API_BASE_URL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input, Spinner } from "@plane/ui";
// services
import { AuthService } from "@/services/auth.service";

type TLDAPFromProps = {
  nextPath: string | null;
  onBack: () => void;
};

type TLDAPFormValues = {
  username: string;
  password: string;
};

const defaultValues: TLDAPFormValues = {
  username: "",
  password: "",
};

const authService = new AuthService();

export const LDAPForm = observer(function LDAPForm(props: TLDAPFromProps) {
  const { nextPath, onBack } = props;
  // plane imports
  const { t } = useTranslation();
  // ref
  const formRef = useRef<HTMLFormElement>(null);
  // states
  const [csrfPromise, setCsrfPromise] = useState<Promise<{ csrf_token: string }> | undefined>(undefined);
  const [ldapFormData, setLdapFormData] = useState<TLDAPFormValues>({ ...defaultValues });
  const [showPassword, setShowPassword] = useState({
    password: false,
    retypePassword: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleShowPassword = (key: keyof typeof showPassword) =>
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleFormChange = (key: keyof TLDAPFormValues, value: string) =>
    setLdapFormData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (csrfPromise === undefined) {
      const promise = authService.requestCSRFToken();
      setCsrfPromise(promise);
    }
  }, [csrfPromise]);

  const isButtonDisabled = useMemo(
    () => (!isSubmitting && !!ldapFormData.password && !!ldapFormData.username ? false : true),
    [isSubmitting, ldapFormData]
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
      action={`${API_BASE_URL}/auth/ldap/`}
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
        <label htmlFor="username" className="text-13 font-medium text-tertiary">
          {t("auth.common.username.label")}
        </label>
        <div className={`relative flex items-center rounded-md bg-surface-1 border border-strong`}>
          <Input
            id="username"
            name="username"
            value={ldapFormData.username}
            onChange={(e) => handleFormChange("username", e.target.value)}
            placeholder={t("auth.common.username.placeholder")}
            className={`disable-autofill-style h-10 w-full`}
          />
          {ldapFormData.username.length > 0 && (
            <button
              type="button"
              className="absolute right-3 size-5"
              onClick={() => handleFormChange("username", "")}
              aria-label={t("aria_labels.auth_forms.clear_username")}
            >
              <XCircle className="size-5 stroke-placeholder" />
            </button>
          )}
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="text-13 text-tertiary font-medium">
          {t("auth.common.password.label")}
        </label>
        <div className="relative flex items-center rounded-md bg-surface-1">
          <Input
            type={showPassword?.password ? "text" : "password"}
            id="password"
            name="password"
            value={ldapFormData.password}
            onChange={(e) => handleFormChange("password", e.target.value)}
            placeholder={t("auth.common.password.placeholder")}
            className="disable-autofill-style h-10 w-full pr-12"
            autoComplete="on"
          />
          <button
            type="button"
            onClick={() => handleShowPassword("password")}
            className="absolute right-3 size-5 grid place-items-center"
            aria-label={t(
              showPassword?.password ? "aria_labels.auth_forms.hide_password" : "aria_labels.auth_forms.show_password"
            )}
          >
            {showPassword?.password ? (
              <EyeOff className="size-5 stroke-placeholder" />
            ) : (
              <Eye className="size-5 stroke-placeholder" />
            )}
          </button>
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
