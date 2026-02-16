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

export const PasswordLoginConfiguration = observer(function PasswordLoginConfiguration(props: Props) {
  const { disabled, updateConfig } = props;
  // store
  const { formattedConfig } = useInstance();
  // derived values
  const enableEmailPassword = formattedConfig?.ENABLE_EMAIL_PASSWORD ?? "";

  return (
    <Switch
      value={Boolean(parseInt(enableEmailPassword))}
      onChange={() => {
        const newEnableEmailPassword = Boolean(parseInt(enableEmailPassword)) === true ? "0" : "1";
        updateConfig("ENABLE_EMAIL_PASSWORD", newEnableEmailPassword);
      }}
      disabled={disabled}
    />
  );
});
