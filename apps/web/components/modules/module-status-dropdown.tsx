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
import type { SelectVariant } from "@plane/blocks/select";
import type { IModule } from "@plane/types";

type ModuleStatusOption = (typeof MODULE_STATUS)[number];

type Props = {
  isDisabled: boolean;
  variant?: SelectVariant;
  moduleDetails: IModule;
  handleModuleDetailsChange: (payload: Partial<IModule>) => Promise<void>;
};

export const ModuleStatusDropdown = observer(function ModuleStatusDropdown(props: Props) {
  const { isDisabled, variant = "pill-sm", moduleDetails, handleModuleDetailsChange } = props;
  const { t } = useTranslation();
  // fall back to backlog so a module without a status can still have one set
  const moduleStatus =
    MODULE_STATUS.find((status) => status.value === moduleDetails.status) ??
    MODULE_STATUS.find((status) => status.value === "backlog");

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
      <Select.Trigger
        disabled={isDisabled}
        variant={variant}
        prependIcon={() => <ModuleStatusIcon status={moduleStatus.value} />}
        label={(statuses: ModuleStatusOption[]) => (statuses[0] ? t(statuses[0].i18n_label) : "")}
        tooltip
      >
        {(statuses: ModuleStatusOption[]) => {
          const status = statuses[0];
          return !!status && <span className="min-w-0 grow truncate text-left">{t(status.i18n_label)}</span>;
        }}
      </Select.Trigger>
    </Select>
  );
});
