"use client";

import React from "react";
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

export const GithubConfiguration: React.FC<Props> = observer((props) => {
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
          <Link href="/authentication/github" className={cn(getButtonStyling("link-primary", "md"), "font-medium")}>
            Edit
          </Link>
          <ToggleSwitch
            value={Boolean(parseInt(enableGithubConfig))}
            onChange={() => {
              const newEnableGithubConfig = Boolean(parseInt(enableGithubConfig)) === true ? "0" : "1";
              updateConfig("IS_GITHUB_ENABLED", newEnableGithubConfig);
            }}
            size="sm"
            disabled={disabled}
          />
        </div>
      ) : (
        <Link
          href="/authentication/github"
          className={cn(getButtonStyling("neutral-primary", "sm"), "text-custom-text-300")}
        >
          <Settings2 className="h-4 w-4 p-0.5 text-custom-text-300/80" />
          Configure
        </Link>
      )}
    </>
  );
});
