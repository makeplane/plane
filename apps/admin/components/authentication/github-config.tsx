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

export const GithubConfiguration = observer(function GithubConfiguration(props: Props) {
  const { disabled, updateConfig } = props;
  // store
  const { formattedConfig } = useInstance();
  // derived values
  const enableGithubConfig = formattedConfig?.IS_GITHUB_ENABLED ?? "";
  const isGithubConfigured = !!formattedConfig?.GITHUB_CLIENT_ID && !!formattedConfig?.GITHUB_CLIENT_SECRET;

  return (
    <>
      {isGithubConfigured ? (
        <div className="flex items-center gap-4">
          <AnchorButton variant="primary" size="sm" render={<Link href="/authentication/github" />} label="Edit" />
          <Switch
            checked={Boolean(parseInt(enableGithubConfig))}
            onCheckedChange={() => {
              const newEnableGithubConfig = Boolean(parseInt(enableGithubConfig)) === true ? "0" : "1";
              updateConfig("IS_GITHUB_ENABLED", newEnableGithubConfig);
            }}
            size="sm"
            aria-label="Enable GitHub"
            disabled={disabled}
          />
        </div>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          stretch="auto"
          nativeButton={false}
          render={<Link href="/authentication/github" />}
          icon={<Icon icon={PreferencesOutline} tint="tertiary" />}
          label="Configure"
        />
      )}
    </>
  );
});
