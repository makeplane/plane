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

import type { FC } from "react";
import { ROLE } from "@plane/constants";
import { Combobox } from "@plane/propel/combobox";
import type { EUserPermissions } from "@plane/types";
import { cn } from "@plane/utils";

type TWorkspaceRoleSelectProps = {
  value: EUserPermissions | undefined;
  onChange: (value: string) => void;
};

export const WorkspaceRoleSelect: FC<TWorkspaceRoleSelectProps> = function WorkspaceRoleSelect(
  props: TWorkspaceRoleSelectProps
) {
  const { value, onChange } = props;

  const options = Object.keys(ROLE).map((key: unknown) => {
    return {
      value: key as string,
      label: ROLE[key as EUserPermissions],
    };
  });

  return (
    <Combobox
      onValueChange={(value) => {
        if (typeof value === "string") {
          onChange(value);
        }
      }}
    >
      <Combobox.Button className="text-start px-3 py-1.25 border border-subtle-1 rounded-md outline-none bg-layer-2">
        <span className={cn("text-14", value ? "text-primary" : "text-placeholder")}>
          {value ? ROLE[value] : "Select role"}
        </span>
      </Combobox.Button>
      <Combobox.Options searchPlaceholder="Search workspace..." optionsContainerClassName="min-w-28">
        {options?.map((option) => (
          <Combobox.Option key={option.value} value={option.value}>
            {option.label}
          </Combobox.Option>
        ))}
      </Combobox.Options>
    </Combobox>
  );
};
