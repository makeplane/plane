"use client";

import React from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useInstance } from "@/hooks";
// ui
import { ToggleSwitch } from "@plane/ui";
// types
import { TInstanceAuthenticationMethodKeys } from "@plane/types";

type Props = {
  disabled: boolean;
  updateConfig: (key: TInstanceAuthenticationMethodKeys, value: string) => void;
};

export const EmailCodesConfiguration: React.FC<Props> = observer((props) => {
  const { disabled, updateConfig } = props;
  // store
  const { formattedConfig } = useInstance();
  // derived values
  const enableMagicLogin = formattedConfig?.ENABLE_MAGIC_LINK_LOGIN ?? "";

  return (
    <ToggleSwitch
      value={Boolean(parseInt(enableMagicLogin))}
      onChange={() => {
        Boolean(parseInt(enableMagicLogin)) === true
          ? updateConfig("ENABLE_MAGIC_LINK_LOGIN", "0")
          : updateConfig("ENABLE_MAGIC_LINK_LOGIN", "1");
      }}
      size="sm"
      disabled={disabled}
    />
  );
});
