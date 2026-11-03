/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { AuthService } from "@plane/services";

// service initialization
const authService = new AuthService();

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Fetches the CSRF token for the admin auth forms, which post natively to the API.
 * Returns "" until a token is available, so forms can keep submit disabled until then.
 */
export function useCsrfToken(): string {
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    let isCancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;

    const fetchToken = async (attempt: number) => {
      try {
        const data = await authService.requestCSRFToken();
        if (!data?.csrf_token) throw new Error("CSRF token not found");
        if (!isCancelled) setCsrfToken(data.csrf_token);
      } catch (error) {
        if (isCancelled) return;
        if (attempt < MAX_ATTEMPTS) retryTimeout = setTimeout(() => void fetchToken(attempt + 1), RETRY_DELAY_MS);
        else console.error("Failed to fetch CSRF token", error);
      }
    };

    void fetchToken(1);

    return () => {
      isCancelled = true;
      clearTimeout(retryTimeout);
    };
  }, []);

  return csrfToken;
}
