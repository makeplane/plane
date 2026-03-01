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
import type { TInstanceEnterpriseAuthenticationMethodKeys } from "@plane/types";
import { Switch } from "@plane/propel/switch";
import { getButtonStyling } from "@plane/propel/button";
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

export const LDAPConfiguration: React.FC<Props> = observer((props) => {
  const { disabled, updateConfig } = props;
  // store
  const { formattedConfig } = useInstance();
  // derived values
  const isLDAPEnabled = useInstanceFlag("LDAP_AUTH");
  const enableLDAPConfig = formattedConfig?.IS_LDAP_ENABLED ?? "";
  const isLDAPConfigured =
    !!formattedConfig?.LDAP_SERVER_URI &&
    !!formattedConfig?.LDAP_BIND_DN &&
    !!formattedConfig?.LDAP_BIND_PASSWORD &&
    !!formattedConfig?.LDAP_USER_SEARCH_BASE;

  if (isLDAPEnabled === false) {
    return <UpgradeButton level="instance" />;
  }

  return (
    <>
      {isLDAPConfigured ? (
        <div className="flex items-center gap-4">
          <Link href="/authentication/ldap" className={cn(getButtonStyling("link", "base"), "font-medium")}>
            Edit
          </Link>
          <Switch
            value={Boolean(parseInt(enableLDAPConfig))}
            onChange={() => {
              const newEnableLDAPConfig = Boolean(parseInt(enableLDAPConfig)) === true ? "0" : "1";
              updateConfig("IS_LDAP_ENABLED", newEnableLDAPConfig);
            }}
            disabled={disabled}
          />
        </div>
      ) : (
        <Link href="/authentication/ldap" className={cn(getButtonStyling("secondary", "base"), "text-tertiary")}>
          <Settings2 className="h-4 w-4 p-0.5 text-tertiary" />
          Configure
        </Link>
      )}
    </>
  );
});
