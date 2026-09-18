/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useSearchParams } from "next/navigation";
// plane imports
import { API_BASE_URL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TOAuthConfigs } from "@plane/types";
// hooks
import { useResearchHealth } from "@/hooks/use-research-health";

/**
 * Extended (installation specific) sign-in providers.
 *
 * PiLab single sign-on is rendered only when the backend reports a usable OIDC
 * configuration; the local form is never removed (P0-ID-06).
 */
export const useExtendedOAuthConfig = (oauthActionText: string): TOAuthConfigs => {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next_path");
  const { oidcConfigured, oidcProvider } = useResearchHealth();

  if (!oidcConfigured) {
    return { isOAuthEnabled: false, oAuthOptions: [] };
  }

  const label = oidcProvider ?? "PiLab";

  return {
    isOAuthEnabled: true,
    oAuthOptions: [
      {
        id: "ai4ms-oidc",
        text: `${oauthActionText} ${t("research.auth.sso_with")} ${label}`,
        icon: (
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <rect x="1" y="1" width="16" height="16" rx="4" fill="#2563EB" />
            <path d="M9 4.2 13 6v3.2c0 2.3-1.6 3.9-4 4.6-2.4-.7-4-2.3-4-4.6V6l4-1.8Z" fill="#fff" />
          </svg>
        ),
        onClick: () => {
          window.location.assign(
            `${API_BASE_URL}/auth/oidc/${nextPath ? `?next_path=${encodeURIComponent(nextPath)}` : ""}`
          );
        },
        enabled: true,
      },
    ],
  };
};
