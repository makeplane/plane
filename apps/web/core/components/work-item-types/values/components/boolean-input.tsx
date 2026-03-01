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

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
// ui
import { Switch } from "@plane/propel/switch";

type TBooleanInputProps = {
  value: string[];
  isDisabled?: boolean;
  onBooleanValueChange: (value: string[]) => Promise<void>;
};

export const BooleanInput = observer(function BooleanInput(props: TBooleanInputProps) {
  const { value, isDisabled = false, onBooleanValueChange } = props;
  // states
  const [data, setData] = useState<string[]>([]);

  const handleChange = (value: boolean) => {
    setData([value.toString()]);
    onBooleanValueChange([value.toString()]);
  };

  useEffect(() => {
    setData(value);
  }, [value]);

  return <Switch value={data?.[0] === "true"} onChange={(value) => handleChange(value)} disabled={isDisabled} />;
});
