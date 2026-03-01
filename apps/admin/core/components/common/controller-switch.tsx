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

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";
// plane internal packages
import { Switch } from "@plane/propel/switch";

type Props<T extends FieldValues = FieldValues> = {
  control: Control<T>;
  field: TControllerSwitchFormField<T>;
};

export type TControllerSwitchFormField<T extends FieldValues = FieldValues> = {
  name: FieldPath<T>;
  label: string;
};

export function ControllerSwitch<T extends FieldValues>(props: Props<T>) {
  const {
    control,
    field: { name, label },
  } = props;

  return (
    <div className="flex items-center justify-between gap-1">
      <h4 className="text-13 text-custom-text-300">{label}</h4>
      <div className="relative">
        <Controller
          control={control}
          name={name as FieldPath<T>}
          render={({ field: { value, onChange } }) => {
            const parsedValue = Number.parseInt(typeof value === "string" ? value : String(value ?? "0"), 10);
            const isOn = !Number.isNaN(parsedValue) && parsedValue !== 0;
            return <Switch value={isOn} onChange={() => onChange(isOn ? "0" : "1")} />;
          }}
        />
      </div>
    </div>
  );
}
