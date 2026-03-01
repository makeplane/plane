/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
// hooks
import type { TInstanceAuthenticationMethodKeys } from "@plane/types";
import { Switch } from "@plane/propel/switch";
import { useInstance } from "@/hooks/store";
// ui
// types

type Props = {
  disabled: boolean;
  updateConfig: (key: TInstanceAuthenticationMethodKeys, value: string) => void;
};

export const EmailCodesConfiguration = observer(function EmailCodesConfiguration(props: Props) {
  const { disabled, updateConfig } = props;
  // store
  const { formattedConfig } = useInstance();
  // derived values
  const enableMagicLogin = formattedConfig?.ENABLE_MAGIC_LINK_LOGIN ?? "";

  return (
    <Switch
      value={Boolean(parseInt(enableMagicLogin))}
      onChange={() => {
        const newEnableMagicLogin = Boolean(parseInt(enableMagicLogin)) === true ? "0" : "1";
        updateConfig("ENABLE_MAGIC_LINK_LOGIN", newEnableMagicLogin);
      }}
      disabled={disabled}
    />
  );
});
