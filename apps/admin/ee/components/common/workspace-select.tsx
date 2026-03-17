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

import { useWorkspace } from "@/hooks/store";
import { Combobox } from "@plane/propel/combobox";
import { cn } from "@plane/utils";
import type { FC } from "react";
import useSWR from "swr";

type TWorkspaceSelectProps = {
  value: string | undefined;
  onChange: (value: string) => void;
};

export const WorkspaceSelect: FC<TWorkspaceSelectProps> = function WorkspaceSelect(props: TWorkspaceSelectProps) {
  const { value, onChange } = props;
  // store hooks
  const { fetchWorkspaces } = useWorkspace();

  // SWR
  const { data } = useSWR("INSTANCE_WORKSPACES", () => fetchWorkspaces());

  // options
  const options = data?.map((workspace) => ({
    label: workspace.name,
    value: workspace.id,
  }));
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
          {value ? options?.find((option) => option.value === value)?.label : "Select workspace"}
        </span>
      </Combobox.Button>
      <Combobox.Options showSearch searchPlaceholder="Search workspace...">
        {options?.map((option) => (
          <Combobox.Option key={option.value} value={option.value}>
            {option.label}
          </Combobox.Option>
        ))}
      </Combobox.Options>
    </Combobox>
  );
};
