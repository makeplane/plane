"use client";

import React from "react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
// icons
import { Settings2 } from "lucide-react";
// plane internal packages
import { TInstanceEnterpriseAuthenticationMethodKeys } from "@plane/types";
import { ToggleSwitch, getButtonStyling } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useInstance } from "@/hooks/store";

type Props = {
  disabled: boolean;
  updateConfig: (key: TInstanceEnterpriseAuthenticationMethodKeys, value: string) => void;
};

export const OIDCConfiguration: React.FC<Props> = observer((props) => {
  const { disabled, updateConfig } = props;
  // store
  const { formattedConfig } = useInstance();
  // derived values
  const enableOIDCConfig = formattedConfig?.IS_OIDC_ENABLED ?? "";
  const isOIDCConfigured = !!formattedConfig?.OIDC_CLIENT_ID && !!formattedConfig?.OIDC_CLIENT_SECRET;

  return (
    <>
      {isOIDCConfigured ? (
        <div className="flex items-center gap-4">
          <Link href="/authentication/oidc" className={cn(getButtonStyling("link-primary", "md"), "font-medium")}>
            Edit
          </Link>
          <ToggleSwitch
            value={Boolean(parseInt(enableOIDCConfig))}
            onChange={() => {
              Boolean(parseInt(enableOIDCConfig)) === true
                ? updateConfig("IS_OIDC_ENABLED", "0")
                : updateConfig("IS_OIDC_ENABLED", "1");
            }}
            size="sm"
            disabled={disabled}
          />
        </div>
      ) : (
        <Link
          href="/authentication/oidc"
          className={cn(getButtonStyling("neutral-primary", "sm"), "text-custom-text-300")}
        >
          <Settings2 className="h-4 w-4 p-0.5 text-custom-text-300/80" />
          Configure
        </Link>
      )}
    </>
  );
});
