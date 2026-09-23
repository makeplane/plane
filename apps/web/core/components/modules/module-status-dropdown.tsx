/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { MODULE_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TModuleStatus } from "@plane/blocks/icons";
import { ModuleStatusIcon } from "@plane/blocks/icons";
import { Select } from "@plane/blocks/select";
import type { IModule } from "@plane/types";

type ModuleStatusOption = (typeof MODULE_STATUS)[number];

type Props = {
  isDisabled: boolean;
  moduleDetails: IModule;
  handleModuleDetailsChange: (payload: Partial<IModule>) => Promise<void>;
};

export const ModuleStatusDropdown = observer(function ModuleStatusDropdown(props: Props) {
  const { isDisabled, moduleDetails, handleModuleDetailsChange } = props;
  const { t } = useTranslation();
  const moduleStatus = MODULE_STATUS.find((status) => status.value === moduleDetails.status);

  if (!moduleStatus) return <></>;

  return (
    <Select<ModuleStatusOption>
      getValues={() => MODULE_STATUS}
      value={moduleStatus}
      onChange={(val) => {
        void handleModuleDetailsChange({ status: val as TModuleStatus });
      }}
      getOptionValue={(status) => status.value}
      getOptionLabel={(status) => t(status.i18n_label)}
      getOptionIcon={(status) => <ModuleStatusIcon status={status.value} />}
      disabled={isDisabled}
      showSearch={false}
      pinSelected={false}
    >
      {/* The chip carries the status colour (a runtime hex), so the trigger chrome is neutralised
          and the coloured surface stays on the inner span — as it was under `customButton`. */}
      <Select.Trigger
        variant="pill-md"
        className={`h-6 border-none bg-transparent p-0 hover:bg-transparent active:bg-transparent ${
          isDisabled ? "cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <span
          className="flex h-6 w-20 items-center justify-center rounded-sm text-center text-11"
          style={{
            color: moduleStatus.color,
            backgroundColor: `${moduleStatus.color}20`,
          }}
        >
          {t(moduleStatus.i18n_label)}
        </span>
      </Select.Trigger>
    </Select>
  );
});
