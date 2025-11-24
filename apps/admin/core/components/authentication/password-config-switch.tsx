import React from "react";
import { observer } from "mobx-react";
// hooks
import type { TInstanceAuthenticationMethodKeys } from "@plane/types";
import { ToggleSwitch } from "@plane/ui";
import { useInstance } from "@/hooks/store";
// ui
// types

type Props = {
  disabled: boolean;
  updateConfig: (key: TInstanceAuthenticationMethodKeys, value: string) => void;
};

export const PasswordLoginConfiguration = observer(function PasswordLoginConfiguration(props: Props) {
  const { disabled, updateConfig } = props;
  // store
  const { formattedConfig } = useInstance();
  // derived values
  const enableEmailPassword = formattedConfig?.ENABLE_EMAIL_PASSWORD ?? "";

  return (
    <ToggleSwitch
      value={Boolean(parseInt(enableEmailPassword))}
      onChange={() => {
        const newEnableEmailPassword = Boolean(parseInt(enableEmailPassword)) === true ? "0" : "1";
        updateConfig("ENABLE_EMAIL_PASSWORD", newEnableEmailPassword);
      }}
      size="sm"
      disabled={disabled}
    />
  );
});
