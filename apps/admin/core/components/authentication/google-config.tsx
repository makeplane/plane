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

export const GoogleConfiguration = observer(function GoogleConfiguration(props: Props) {
  const { disabled, updateConfig } = props;
  // store
  const { formattedConfig } = useInstance();
  // derived values
  const enableGoogleConfig = formattedConfig?.IS_GOOGLE_ENABLED ?? "";
  const isGoogleConfigured = !!formattedConfig?.GOOGLE_CLIENT_ID && !!formattedConfig?.GOOGLE_CLIENT_SECRET;

  return (
    <>
      {isGoogleConfigured ? (
        <div className="flex items-center gap-4">
          <Link href="/authentication/google" className={cn(getButtonStyling("link", "base"), "font-medium")}>
            Edit
          </Link>
          <ToggleSwitch
            value={Boolean(parseInt(enableGoogleConfig))}
            onChange={() => {
              const newEnableGoogleConfig = Boolean(parseInt(enableGoogleConfig)) === true ? "0" : "1";
              updateConfig("IS_GOOGLE_ENABLED", newEnableGoogleConfig);
            }}
            size="sm"
            disabled={disabled}
          />
        </div>
      ) : (
        <Link href="/authentication/google" className={cn(getButtonStyling("secondary", "base"), "text-tertiary")}>
          <Settings2 className="h-4 w-4 p-0.5 text-tertiary" />
          Configure
        </Link>
      )}
    </>
  );
});
