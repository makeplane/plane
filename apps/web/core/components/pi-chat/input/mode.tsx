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

import { AiSearchIcon, AiWriteIcon } from "@plane/propel/icons";
import { Combobox } from "@plane/propel/combobox";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
import { ChevronDownIcon } from "lucide-react";

const MODE_OPTIONS = [
  {
    label: "Ask",
    value: "ask",
    icon: <AiSearchIcon className="size-4" />,
  },
  {
    label: "Build",
    value: "build",
    icon: <AiWriteIcon className="size-4" />,
  },
];

export function AiMode(props: { aiMode: string; setAiMode: (mode: string) => void }) {
  const { aiMode, setAiMode } = props;
  const selectedMode = MODE_OPTIONS.find((option) => option.value === aiMode);

  return (
    <Combobox value={aiMode} onValueChange={(val) => setAiMode(val as string)}>
      <Tooltip tooltipContent="Select the mode of the AI to use for the conversation." position="top">
        <Combobox.Button
          className={cn(
            "flex items-center gap-1 rounded-lg h-[28px] px-2 bg-layer-2 border border-subtle-1 overflow-hidden hover:bg-surface-1 hover:shadow-raised-100 shrink-0"
          )}
        >
          <span className="flex items-center gap-2 text-icon-secondary">{selectedMode?.icon}</span>
          <span className="text-body-xs-medium truncate text-primary">{selectedMode?.label}</span>
          <ChevronDownIcon className="size-4 text-icon-secondary" />
        </Combobox.Button>
      </Tooltip>
      <Combobox.Options className="max-h-[70vh] overflow-y-auto" maxHeight="lg">
        {MODE_OPTIONS.map((option) => (
          <Combobox.Option
            key={option.value}
            value={option.value}
            className="text-13 text-secondary font-medium flex w-full items-center gap-2 data-[highlighted]:bg-layer-transparent-hover"
          >
            <span className="flex items-center gap-2 text-tertiary">{option.icon}</span>
            <span className="text-13 truncate">{option.label}</span>
          </Combobox.Option>
        ))}
      </Combobox.Options>
    </Combobox>
  );
}
