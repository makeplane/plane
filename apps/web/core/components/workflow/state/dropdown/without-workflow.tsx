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
import { Combobox } from "@headlessui/react";
import { CheckIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
// local imports
import type { TWorkItemStateOptionProps } from "./types";

export const WorkItemStateOptionWithoutWorkflow = observer(function WorkItemStateOptionWithoutWorkflow(
  props: TWorkItemStateOptionProps
) {
  const { option, className = "" } = props;

  return (
    <Combobox.Option
      key={option.value}
      value={option.value}
      className={({ active, selected }) =>
        cn(`${className} ${active ? "bg-layer-transparent-hover" : ""} ${selected ? "text-primary" : "text-secondary"}`)
      }
    >
      {({ selected }) => (
        <>
          <span className="flex-grow truncate">{option.content}</span>
          {selected && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" />}
        </>
      )}
    </Combobox.Option>
  );
});
