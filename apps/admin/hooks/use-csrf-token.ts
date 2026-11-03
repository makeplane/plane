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
        if (attempt < MAX_ATTEMPTS) setAttempt((prev) => prev + 1);
        else console.error("Failed to fetch CSRF token", error);
      }
    };

    const timeout = setTimeout(() => void fetchToken(), attempt === 1 ? 0 : RETRY_DELAY_MS);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [attempt]);

  return csrfToken;
}
