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

import { useState } from "react";
// plane internal packages
import type { TAdminAuthErrorInfo } from "@plane/constants";
import { API_BASE_URL, EErrorAlertType, EAdminAuthErrorCodes as AdminErrorCodes } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { Input, Spinner } from "@plane/ui";
import { checkEmailValidity } from "@plane/utils";

type Props = {
  email: string;
  onEmailChange: (email: string) => void;
  onPasswordStep: () => void;
  onMagicCodeStep: () => void;
  onError: (error: TAdminAuthErrorInfo) => void;
};

export function EmailForm(props: Props) {
  const { email, onEmailChange, onPasswordStep, onMagicCodeStep, onError } = props;
  // state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !checkEmailValidity(email)) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/instances/admins/email-check/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.status === "MAGIC_CODE") {
          onMagicCodeStep();
        } else {
          onPasswordStep();
        }
      } else {
        const data = await response.json();
        onError({
          type: EErrorAlertType.BANNER_ALERT,
          code: data?.error_code || AdminErrorCodes.ADMIN_AUTHENTICATION_FAILED,
          title: "Error",
          message: data?.error_message || "Something went wrong. Please try again.",
        });
      }
    } catch {
      onError({
        type: EErrorAlertType.BANNER_ALERT,
        code: AdminErrorCodes.ADMIN_AUTHENTICATION_FAILED,
        title: "Error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleEmailCheck} className="space-y-4">
      <div className="w-full space-y-1">
        <label className="text-13 text-tertiary font-medium" htmlFor="email">
          Email <span className="text-danger-primary">*</span>
        </label>
        <Input
          className="w-full border border-subtle !bg-surface-1 placeholder:text-placeholder"
          id="email"
          name="email"
          type="email"
          inputSize="md"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          autoComplete="off"
          autoFocus
        />
      </div>
      <Button
        type="submit"
        size="xl"
        className="w-full"
        disabled={isSubmitting || !email.trim() || !checkEmailValidity(email)}
      >
        {isSubmitting ? <Spinner height="20px" width="20px" /> : "Continue"}
      </Button>
    </form>
  );
}
