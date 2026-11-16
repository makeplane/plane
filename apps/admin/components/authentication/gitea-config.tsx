/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
// icons
import { PreferencesOutline } from "@makeplane/propel/icons";
// plane internal packages
import { AnchorButton } from "@makeplane/propel/components/anchor-button";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { Switch } from "@makeplane/propel/components/switch";
import type { TInstanceAuthenticationMethodKeys } from "@plane/types";
// hooks
import { useInstance } from "@/hooks/store";

type Props = {
  disabled: boolean;
  updateConfig: (key: TInstanceAuthenticationMethodKeys, value: string) => void;
};

export const GiteaConfiguration = observer(function GiteaConfiguration(props: Props) {
  const { disabled, updateConfig } = props;
  // store
  const { formattedConfig } = useInstance();
  // derived values
  const GiteaConfig = formattedConfig?.IS_GITEA_ENABLED ?? "";
  const GiteaConfigured =
    !!formattedConfig?.GITEA_HOST && !!formattedConfig?.GITEA_CLIENT_ID && !!formattedConfig?.GITEA_CLIENT_SECRET;

  return (
    <>
      {GiteaConfigured ? (
        <div className="flex items-center gap-4">
          <AnchorButton variant="primary" size="sm" render={<Link href="/authentication/gitea" />} label="Edit" />
          <Switch
            checked={Boolean(parseInt(GiteaConfig))}
            onCheckedChange={() => {
              Boolean(parseInt(GiteaConfig)) === true
                ? updateConfig("IS_GITEA_ENABLED", "0")
                : updateConfig("IS_GITEA_ENABLED", "1");
            }}
            size="sm"
            aria-label="Enable Gitea"
            disabled={disabled}
          />
        </div>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          stretch="auto"
          nativeButton={false}
          render={<Link href="/authentication/gitea" />}
          icon={<Icon icon={PreferencesOutline} tint="tertiary" />}
          label="Configure"
        />
      )}
    </>
  );
});
