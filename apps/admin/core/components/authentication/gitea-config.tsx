"use client";

import React from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// icons
import { Settings2 } from "lucide-react";
// plane internal packages
import { TInstanceAuthenticationMethodKeys } from "@plane/types";
import { ToggleSwitch, getButtonStyling } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useInstance } from "@/hooks/store";

type Props = {
  disabled: boolean;
  updateConfig: (key: TInstanceAuthenticationMethodKeys, value: string) => void;
};

export const GiteaConfiguration: React.FC<Props> = observer((props) => {
  const { disabled, updateConfig } = props;
  // store
  const { formattedConfig } = useInstance();
  // derived values
  const GiteaConfig = formattedConfig?.IS_GITEA_ENABLED ?? "";
  const GiteaConfigured = !!formattedConfig?.GITEA_HOST && !!formattedConfig?.GITEA_CLIENT_ID && !!formattedConfig?.GITEA_CLIENT_SECRET;

  return (
    <>
      {GiteaConfigured ? (
        <div className="flex items-center gap-4">
          <Link href="/authentication/gitea" className={cn(getButtonStyling("link-primary", "md"), "font-medium")}>
            Edit
          </Link>
          <ToggleSwitch
            value={Boolean(parseInt(GiteaConfig))}
            onChange={() => {
              Boolean(parseInt(GiteaConfig)) === true
                ? updateConfig("IS_GITEA_ENABLED", "0")
                : updateConfig("IS_GITEA_ENABLED", "1");
            }}
            size="sm"
            disabled={disabled}
          />
        </div>
      ) : (
        <Link
          href="/authentication/gitea"
          className={cn(getButtonStyling("neutral-primary", "sm"), "text-custom-text-300")}
        >
          <Settings2 className="h-4 w-4 p-0.5 text-custom-text-300/80" />
          Configure
        </Link>
      )}
    </>
  );
});
