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

import { useFormContext } from "react-hook-form";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { CheckIcon } from "@plane/propel/icons";
import type { RunnerScriptFormData } from "@plane/types";
import { ERunnerScriptType, RUNNER_SCRIPT_TYPE_MAP } from "@plane/types";
import { cn, Dropdown } from "@plane/ui";

type Props = {
  onScriptTypeChange?: (value: ERunnerScriptType) => void;
};

export function SelectScriptType({ onScriptTypeChange }: Props) {
  const { watch } = useFormContext<RunnerScriptFormData>();
  const { t } = useTranslation();

  return (
    <Dropdown
      onChange={(value: string) => onScriptTypeChange?.(value as ERunnerScriptType)}
      value={watch("script_type") ?? ERunnerScriptType.AUTOMATION}
      keyExtractor={(option) => option.data}
      options={Object.values(ERunnerScriptType).map((type) => ({
        data: type.toString(),
        value: type.toString(),
      }))}
      disableSearch
      buttonContainerClassName="bg-surface-1 border border-subtle-1 rounded-md px-2 py-1 w-full"
      buttonContent={(isOpen, val) => (
        <span className="flex items-center justify-between gap-1 text-13 text-tertiary w-full">
          {val ? RUNNER_SCRIPT_TYPE_MAP[val as ERunnerScriptType] : t("common.select")}
          <ChevronDown size={16} className={cn(isOpen ? "rotate-180 ml-auto" : "rotate-0 ml-auto")} />
        </span>
      )}
      renderItem={(option) => (
        <span className="flex items-center gap-1">
          {RUNNER_SCRIPT_TYPE_MAP[option.value as ERunnerScriptType]}
          {option.selected && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" />}
        </span>
      )}
    />
  );
}
