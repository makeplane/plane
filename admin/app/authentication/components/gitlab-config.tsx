"use client";

import React from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// icons
import { Settings2 } from "lucide-react";
// types
import { TInstanceAuthenticationMethodKeys } from "@plane/types";
// ui
import { ToggleSwitch, getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useInstance } from "@/hooks/store";

type Props = {
  disabled: boolean;
  updateConfig: (key: TInstanceAuthenticationMethodKeys, value: string) => void;
};

export const GitlabConfiguration: React.FC<Props> = observer((props) => {
  const { disabled, updateConfig } = props;
  // store
  const { formattedConfig } = useInstance();
  // derived values
  const enableGitlabConfig = formattedConfig?.IS_GITLAB_ENABLED ?? "";
  const isGitlabConfigured = !!formattedConfig?.GITLAB_CLIENT_ID && !!formattedConfig?.GITLAB_CLIENT_SECRET;

  return (
    <>
      {isGitlabConfigured ? (
        <div className="flex items-center gap-4">
          <Link href="/authentication/gitlab" className={cn(getButtonStyling("link-primary", "md"), "font-medium")}>
            Edit
          </Link>
          <ToggleSwitch
            value={Boolean(parseInt(enableGitlabConfig))}
            onChange={() => {
              Boolean(parseInt(enableGitlabConfig)) === true
                ? updateConfig("IS_GITLAB_ENABLED", "0")
                : updateConfig("IS_GITLAB_ENABLED", "1");
            }}
            size="sm"
            disabled={disabled}
          />
        </div>
      ) : (
        <Link
          href="/authentication/gitlab"
          className={cn(getButtonStyling("neutral-primary", "sm"), "text-custom-text-300")}
        >
          <Settings2 className="h-4 w-4 p-0.5 text-custom-text-300/80" />
          Configure
        </Link>
      )}
    </>
  );
});
