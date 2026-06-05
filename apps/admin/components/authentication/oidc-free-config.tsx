/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
// icons
import { Settings2 } from "lucide-react";
// plane internal packages
import { getButtonStyling } from "@plane/propel/button";
import type { TInstanceAuthenticationMethodKeys } from "@plane/types";
import { ToggleSwitch } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useInstance } from "@/hooks/store";

type Props = {
  disabled: boolean;
  updateConfig: (key: TInstanceAuthenticationMethodKeys, value: string) => void;
};

export const OidcFreeConfiguration = observer(function OidcFreeConfiguration(props: Props) {
  const { disabled, updateConfig } = props;
  // store
  const { formattedConfig } = useInstance();
  // derived values
  const OidcFreeConfig = formattedConfig?.IS_OIDC_FREE_ENABLED ?? "";
  const OidcFreeConfigured =
    [
      !!formattedConfig?.OIDC_FREE_CLIENT_ID,
      !!formattedConfig?.OIDC_FREE_CLIENT_SECRET,
      !!formattedConfig?.OIDC_FREE_HOST,
      !!formattedConfig?.OIDC_FREE_SCOPE,
      !!formattedConfig?.OIDC_FREE_USERINFO_URL,
      !!formattedConfig?.OIDC_FREE_TOKEN_URL,
      !!formattedConfig?.OIDC_FREE_CALLBACK_URI,
      !!formattedConfig?.OIDC_FREE_AUTH_URI,
    ].reduce((acc, curr) => acc && curr, true);

  return (
    <>
      {OidcFreeConfigured ? (
        <div className="flex items-center gap-4">
          <Link href="/authentication/oidc-free" className={cn(getButtonStyling("link", "base"), "font-medium")}>
            Edit
          </Link>
          <ToggleSwitch
            value={Boolean(parseInt(OidcFreeConfig))}
            onChange={() => {
              Boolean(parseInt(OidcFreeConfig)) === true
                ? updateConfig("IS_OIDC_FREE_ENABLED", "0")
                : updateConfig("IS_OIDC_FREE_ENABLED", "1");
            }}
            size="sm"
            disabled={disabled}
          />
        </div>
      ) : (
        <Link href="/authentication/oidc-free" className={cn(getButtonStyling("secondary", "base"), "text-tertiary")}>
          <Settings2 className="h-4 w-4 p-0.5 text-tertiary" />
          Configure
        </Link>
      )}
    </>
  );
});
