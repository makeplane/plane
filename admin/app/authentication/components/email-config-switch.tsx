"use client";

import React from "react";
import { observer } from "mobx-react";
// hooks
import { TInstanceAuthenticationMethodKeys } from "@plane/types";
import { ToggleSwitch } from "@plane/ui";
import { useInstance } from "@/hooks/store";
// ui
// types

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
