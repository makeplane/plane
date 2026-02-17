/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// icons
import { Eye, EyeOff } from "lucide-react";
// plane imports
import { API_BASE_URL } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { Input, Spinner } from "@plane/ui";
// services
import { AuthService } from "@/services/auth.service";

type Props = {
  nextPath: string | undefined;
};

const authService = new AuthService();

export const AuthLDAPForm = observer(function AuthLDAPForm(props: Props) {
  const { nextPath } = props;
  // refs
  const formRef = useRef<HTMLFormElement>(null);
  // states
  const [csrfPromise, setCsrfPromise] = useState<Promise<{ csrf_token: string }> | undefined>(undefined);
  const [isCsrfReady, setIsCsrfReady] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (csrfPromise === undefined) {
      const promise = authService.requestCSRFToken();
      setCsrfPromise(promise);
      promise.then(() => setIsCsrfReady(true)).catch(() => setIsCsrfReady(false));
    }
  }, [csrfPromise]);

  const handleCSRFToken = async () => {
    if (!formRef?.current) return;
    const token = await csrfPromise;
    if (!token?.csrf_token) return;
    const csrfElement = formRef.current.querySelector("input[name=csrfmiddlewaretoken]");
    csrfElement?.setAttribute("value", token?.csrf_token);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || !username || !password) return;

    void (async () => {
      await handleCSRFToken();
      setIsSubmitting(true);
      if (formRef.current) formRef.current.submit();
    })();
  };

  const isButtonDisabled = !username || !password || isSubmitting || !isCsrfReady;

  return (
    <form
      ref={formRef}
      className="space-y-4"
      method="POST"
      action={`${API_BASE_URL}/auth/ldap/sign-in/`}
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="csrfmiddlewaretoken" />
      {nextPath && <input type="hidden" value={nextPath} name="next_path" />}

      {/* LDAP username input */}
      <div className="space-y-1">
        <label htmlFor="ldap-username" className="text-13 font-medium text-tertiary">
          LDAP Username
        </label>
        <Input
          id="ldap-username"
          name="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter LDAP username"
          className="disable-autofill-style h-10 w-full border border-strong !bg-surface-1 placeholder:text-placeholder"
          autoComplete="on"
        />
      </div>

      {/* Password input */}
      <div className="space-y-1">
        <label htmlFor="ldap-password" className="text-13 text-tertiary font-medium">
          Password
        </label>
        <div className="relative flex items-center rounded-md bg-surface-1">
          <Input
            type={showPassword ? "text" : "password"}
            id="ldap-password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="disable-autofill-style h-10 w-full border border-strong !bg-surface-1 pr-12 placeholder:text-placeholder"
            autoComplete="on"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 size-5 grid place-items-center"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-5 stroke-placeholder" />
            ) : (
              <Eye className="size-5 stroke-placeholder" />
            )}
          </button>
        </div>
      </div>

      <Button type="submit" variant="primary" className="w-full" size="xl" disabled={isButtonDisabled}>
        {isSubmitting ? <Spinner height="20px" width="20px" /> : "Sign in with LDAP"}
      </Button>
    </form>
  );
});
