/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useSearchParams } from "next/navigation";
// plane imports
import { API_BASE_URL } from "@plane/constants";
import type { TOAuthConfigs } from "@plane/types";
// assets
import zelianLogo from "@/app/assets/logos/zelian-logo.svg?url";
// hooks
import { useInstance } from "@/hooks/store/use-instance";

export const useExtendedOAuthConfig = (oauthActionText: string): TOAuthConfigs => {
  // router
  const searchParams = useSearchParams();
  const next_path = searchParams.get("next_path");
  // store hooks
  const { config } = useInstance();

  return {
    isOAuthEnabled: config?.is_zelian_enabled || false,
    oAuthOptions: [
      {
        id: "zelian",
        text: `${oauthActionText} with Zelian`,
        icon: <img src={zelianLogo} height={18} width={18} alt="Zelian" />,
        onClick: () => {
          window.location.assign(`${API_BASE_URL}/auth/zelian/${next_path ? `?next_path=${next_path}` : ``}`);
        },
        enabled: config?.is_zelian_enabled,
      },
    ],
  };
};
