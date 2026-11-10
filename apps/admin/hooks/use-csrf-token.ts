/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { AuthService } from "@plane/services";

// service initialization
const authService = new AuthService();

const BASE_RETRY_DELAY_MS = 2000;
const MAX_RETRY_DELAY_MS = 30000;
// log once when the token is still missing after this many attempts, instead of on every retry
const LOG_AFTER_ATTEMPTS = 3;

// 0 for the first attempt, then 2s, 4s, 8s, 16s, capped at 30s
const getRetryDelay = (attempt: number) =>
  attempt === 1 ? 0 : Math.min(BASE_RETRY_DELAY_MS * 2 ** (attempt - 2), MAX_RETRY_DELAY_MS);

/**
 * Fetches the CSRF token for the admin auth forms, which post natively to the API.
 * Returns "" until a token is available, so forms can keep submit disabled until then.
 * Keeps retrying with backoff, so the forms recover on their own after an API outage.
 */
export function useCsrfToken(): string {
  const [csrfToken, setCsrfToken] = useState("");
  const [attempt, setAttempt] = useState(1);

  // each attempt is one effect run; a failed attempt schedules the next by bumping `attempt`
  useEffect(() => {
    let isCancelled = false;

    const fetchToken = async () => {
      try {
        const data = await authService.requestCSRFToken();
        if (!data?.csrf_token) throw new Error("CSRF token not found");
        if (!isCancelled) setCsrfToken(data.csrf_token);
      } catch (error) {
        if (isCancelled) return;
        if (attempt === LOG_AFTER_ATTEMPTS) console.error("Failed to fetch CSRF token, still retrying", error);
        setAttempt((prev) => prev + 1);
      }
    };

    const timeout = setTimeout(() => void fetchToken(), getRetryDelay(attempt));

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [attempt]);

  return csrfToken;
}
