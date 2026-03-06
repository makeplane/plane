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

import { useMemo, useState } from "react";
import { Eye, EyeOff, XCircle } from "lucide-react";
// plane internal packages
import { API_BASE_URL } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { Input, Spinner } from "@plane/ui";

type Props = {
  email: string;
  csrfToken: string | undefined;
  onEmailClear: () => void;
  onSwitchToMagicCode?: () => void;
};

export function PasswordForm(props: Props) {
  const { email, csrfToken, onEmailClear, onSwitchToMagicCode } = props;
  // state
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPasswordButtonDisabled = useMemo(
    () => (!isSubmitting && email && password ? false : true),
    [email, password, isSubmitting]
  );

  return (
    <form
      className="space-y-4"
      method="POST"
      action={`${API_BASE_URL}/api/instances/admins/sign-in/`}
      onSubmit={() => setIsSubmitting(true)}
    >
      <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
      <div className="w-full space-y-1">
        <label className="text-13 text-tertiary font-medium" htmlFor="email">
          Email <span className="text-danger-primary">*</span>
        </label>
        <div className="relative">
          <Input
            className="w-full border border-subtle !bg-surface-1 placeholder:text-placeholder"
            id="email"
            name="email"
            type="email"
            inputSize="md"
            value={email}
            readOnly
          />
          <button
            type="button"
            className="absolute right-3 top-3.5 flex items-center justify-center text-placeholder cursor-pointer"
            onClick={onEmailClear}
            aria-label="Clear email"
          >
            <XCircle className="h-4 w-4" />
          </button>
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
            autoFocus
          />
          {showPassword ? (
            <button
              type="button"
              className="absolute right-3 top-3.5 flex items-center justify-center text-placeholder"
              onClick={() => setShowPassword(false)}
            >
              <EyeOff className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              className="absolute right-3 top-3.5 flex items-center justify-center text-placeholder"
              onClick={() => setShowPassword(true)}
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="space-y-2.5 py-2">
        <Button type="submit" size="xl" className="w-full" disabled={isPasswordButtonDisabled}>
          {isSubmitting ? <Spinner height="20px" width="20px" /> : "Sign in"}
        </Button>
        {onSwitchToMagicCode && (
          <Button type="button" variant="secondary" size="xl" className="w-full" onClick={onSwitchToMagicCode}>
            Sign in with magic code
          </Button>
        )}
      </div>
    </form>
  );
}
