/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import useSWR from "swr";
// plane imports
import { API_BASE_URL } from "@plane/constants";

export type TResearchHealth = {
  module_enabled: boolean;
  limits: Record<string, number>;
  oidc_configured?: boolean;
  oidc_provider?: string | null;
};

const fetcher = (url: string): Promise<TResearchHealth> =>
  fetch(url, { credentials: "include" }).then((response) => {
    if (!response.ok) throw new Error("Unable to load research health");
    return response.json();
  });

/**
 * Public availability probe. Used by the sign-in screen to decide whether the
 * AI4MS single sign-on entry point should be rendered (P0-ID-06 keeps the
 * local form available either way).
 */
export const useResearchHealth = () => {
  const { data, error, isLoading } = useSWR<TResearchHealth>(`${API_BASE_URL}/api/research/health/`, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  return {
    health: data,
    isLoading,
    isError: Boolean(error),
    oidcConfigured: Boolean(data?.oidc_configured),
    oidcProvider: data?.oidc_provider ?? null,
    moduleEnabled: Boolean(data?.module_enabled),
  };
};
