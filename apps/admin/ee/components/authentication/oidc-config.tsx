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

import { observer } from "mobx-react";
import Link from "next/link";
// icons
import { Settings2 } from "lucide-react";
// plane internal packages
import { getButtonStyling } from "@plane/propel/button";
import { Switch } from "@plane/propel/switch";
import type { TInstanceEnterpriseAuthenticationMethodKeys } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useInstance } from "@/hooks/store";
// plane admin imports
import { UpgradeButton } from "@/plane-admin/components/common";
import { useInstanceFlag } from "@/plane-admin/hooks/store/use-instance-flag";

type Props = {
  disabled: boolean;
  updateConfig: (key: TInstanceEnterpriseAuthenticationMethodKeys, value: string) => void;
};

export const OIDCConfiguration = observer(function OIDCConfiguration(props: Props) {
  const { disabled, updateConfig } = props;
  // store
  const { formattedConfig } = useInstance();
  // derived values
  const isOIDCEnabled = useInstanceFlag("OIDC_SAML_AUTH");
  const enableOIDCConfig = formattedConfig?.IS_OIDC_ENABLED ?? "";
  const isOIDCConfigured = !!formattedConfig?.OIDC_CLIENT_ID && !!formattedConfig?.OIDC_CLIENT_SECRET;

  if (isOIDCEnabled === false) {
    return <UpgradeButton level="workspace" />;
  }

  return (
    <>
      {isOIDCConfigured ? (
        <div className="flex items-center gap-4">
          <Link href="/authentication/oidc" className={cn(getButtonStyling("link", "base"), "font-medium")}>
            Edit
          </Link>
          <Switch
            value={Boolean(parseInt(enableOIDCConfig))}
            onChange={() => {
              const newEnableOIDCConfig = Boolean(parseInt(enableOIDCConfig)) === true ? "0" : "1";
              updateConfig("IS_OIDC_ENABLED", newEnableOIDCConfig);
            }}
            disabled={disabled}
          />
        </div>
      ) : (
        <Link href="/authentication/oidc" className={cn(getButtonStyling("secondary", "base"), "text-tertiary")}>
          <Settings2 className="h-4 w-4 p-0.5 text-tertiary" />
          Configure
        </Link>
      )}
    </>
  );
});
