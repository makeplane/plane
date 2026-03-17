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
import { useNavigate, useSearchParams } from "react-router";
import { observer } from "mobx-react";
import { Eye, EyeOff, XCircle } from "lucide-react";
// plane internal packages
import type { EAdminAuthErrorCodes, TAdminAuthErrorInfo } from "@plane/constants";
import { API_BASE_URL } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { AuthService } from "@plane/services";
import { Input, Spinner } from "@plane/ui";
// components
import { FormHeader } from "@/components/instance/form-header";
import { AuthBanner } from "../auth-banner";
import { AuthHeader } from "../auth-header";
import { authErrorHandler } from "../auth-helpers";
// hooks
import { useInstance } from "@/hooks/store";
// types
import type { Route } from "./+types/page";

const authService = new AuthService();

type TLDAPFormValues = {
  username: string;
  password: string;
};

const defaultValues: TLDAPFormValues = {
  username: "",
  password: "",
};

function LDAPPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get("error_code") || undefined;
  // store hooks
  const { config } = useInstance();
  // ref
  const formRef = useRef<HTMLFormElement>(null);
  // state
  const [csrfPromise, setCsrfPromise] = useState<Promise<{ csrf_token: string }> | undefined>(undefined);
  const [formData, setFormData] = useState<TLDAPFormValues>({ ...defaultValues });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorInfo, setErrorInfo] = useState<TAdminAuthErrorInfo | undefined>(undefined);

  // derived values
  const ldapProviderName = config?.ldap_provider_name?.trim() || "LDAP";

  const handleFormChange = (key: keyof TLDAPFormValues, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (csrfPromise === undefined) {
      const promise = authService.requestCSRFToken();
      setCsrfPromise(promise);
    }
  }, [csrfPromise]);

  useEffect(() => {
    if (errorCode) {
      const errorDetail = authErrorHandler(errorCode?.toString() as EAdminAuthErrorCodes);
      if (errorDetail) {
        setErrorInfo(errorDetail);
      }
    }
  }, [errorCode]);

  const isButtonDisabled = useMemo(
    () => (!isSubmitting && !!formData.password && !!formData.username ? false : true),
    [isSubmitting, formData]
  );

  const handleCSRFToken = async () => {
    if (!formRef || !formRef.current) return;
    const token = await csrfPromise;
    if (!token?.csrf_token) return;
    const csrfElement = formRef.current.querySelector("input[name=csrfmiddlewaretoken]");
    csrfElement?.setAttribute("value", token?.csrf_token);
  };

  return (
    <>
      <AuthHeader />
      <div className="flex flex-col justify-center items-center flex-grow w-full py-6 mt-10">
        <div className="relative flex flex-col gap-6 max-w-[22.5rem] w-full">
          <FormHeader
            heading={`Sign in with ${ldapProviderName}`}
            subHeading={`Enter your ${ldapProviderName} credentials to access the admin panel`}
          />
          {errorInfo && <AuthBanner bannerData={errorInfo} handleBannerData={(value) => setErrorInfo(value)} />}
          <form
            ref={formRef}
            className="space-y-4"
            method="POST"
            action={`${API_BASE_URL}/api/instances/admin/ldap/`}
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

            <div className="w-full space-y-1">
              <label className="text-13 text-tertiary font-medium" htmlFor="username">
                Username <span className="text-danger-primary">*</span>
              </label>
              <div className="relative flex items-center rounded-md bg-surface-1 border border-subtle">
                <Input
                  className="w-full border-none !bg-surface-1 placeholder:text-placeholder"
                  id="username"
                  name="username"
                  type="text"
                  inputSize="md"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={(e) => handleFormChange("username", e.target.value)}
                  autoComplete="off"
                  autoFocus
                />
                {formData.username.length > 0 && (
                  <button
                    type="button"
                    className="absolute right-3 size-5"
                    onClick={() => handleFormChange("username", "")}
                  >
                    <XCircle className="size-5 stroke-placeholder" />
                  </button>
                )}
              </div>
            </div>

            <div className="w-full space-y-1">
              <label className="text-13 text-tertiary font-medium" htmlFor="password">
                Password <span className="text-danger-primary">*</span>
              </label>
              <div className="relative">
                <Input
                  className="w-full border border-subtle !bg-surface-1 placeholder:text-placeholder"
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  inputSize="md"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleFormChange("password", e.target.value)}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3.5 flex items-center justify-center text-placeholder"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2.5 py-2">
              <Button type="submit" size="xl" className="w-full" disabled={isButtonDisabled}>
                {isSubmitting ? <Spinner height="20px" width="20px" /> : "Sign in"}
              </Button>
              <Button type="button" variant="secondary" size="xl" className="w-full" onClick={() => void navigate("/")}>
                Go back
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default observer(LDAPPage);

export const meta: Route.MetaFunction = () => [
  { title: "Admin – LDAP Sign-In" },
  { name: "description", content: "Sign in to the admin portal using LDAP." },
];
