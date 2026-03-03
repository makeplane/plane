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

import { useMemo } from "react";
import { useLocation, useNavigate, useParams as useParamsRR, useSearchParams as useSearchParamsRR } from "react-router";
import { ensureTrailingSlash } from "./helper";

/**
 * @deprecated Legacy Next.js compatibility shim. Use useNavigate() from react-router directly instead.
 */
export function useRouter() {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      push: (to: string) => {
        // Defer navigation to avoid state updates during render
        setTimeout(() => navigate(ensureTrailingSlash(to)), 0);
      },
      replace: (to: string) => {
        // Defer navigation to avoid state updates during render
        setTimeout(() => navigate(ensureTrailingSlash(to), { replace: true }), 0);
      },
      back: () => {
        setTimeout(() => navigate(-1), 0);
      },
      forward: () => {
        setTimeout(() => navigate(1), 0);
      },
      refresh: () => {
        location.reload();
      },
      prefetch: async (_to: string) => {
        // no-op in this shim
      },
    }),
    [navigate]
  );
}

/**
 * @deprecated Legacy Next.js compatibility shim. Use useLocation().pathname from react-router directly instead.
 */
export function usePathname(): string {
  const { pathname } = useLocation();
  return pathname;
}

/**
 * @deprecated Legacy Next.js compatibility shim. Use useSearchParams() from react-router directly instead.
 */
export function useSearchParams(): URLSearchParams {
  const [searchParams] = useSearchParamsRR();
  return searchParams;
}

/**
 * @deprecated Legacy Next.js compatibility shim. Use useParams() from react-router directly instead.
 * For type-safe route data passed via props, prefer Route.ComponentProps.
 */
export function useParams() {
  return useParamsRR();
}
