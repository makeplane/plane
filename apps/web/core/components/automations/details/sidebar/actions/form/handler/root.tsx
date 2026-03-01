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

import { Zap } from "lucide-react";
import { useParams } from "next/navigation";
// plane imports
import { AUTOMATION_ACTION_HANDLER_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ChevronDownIcon } from "@plane/propel/icons";
import type { E_INTEGRATION_KEYS, TActionNodeHandlerName } from "@plane/types";
import { CustomSelect } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useFeatureFlags } from "@/plane-web/hooks/store/use-feature-flags";
// local imports
import { AutomationActionHandlerIcon } from "./icon";

type TProps = {
  value: Partial<TActionNodeHandlerName> | undefined;
  onChange: (value: TActionNodeHandlerName) => void;
  isDisabled?: boolean;
};

export function AutomationActionHandlerDropdown(props: TProps) {
  const { value, onChange, isDisabled } = props;
  const { workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  const { getIntegrations } = useFeatureFlags();
  // derived values
  const enabledIntegrations = getIntegrations(workspaceSlug);
  const filteredOptions = AUTOMATION_ACTION_HANDLER_OPTIONS.filter(
    (option) => !option.integrationKey || enabledIntegrations.includes(option.integrationKey as E_INTEGRATION_KEYS)
  );
  const selectedValue = AUTOMATION_ACTION_HANDLER_OPTIONS.find((option) => option.value === value);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1">
        <span className="flex-shrink-0 size-4 grid place-items-center">
          <Zap className="size-3" />
        </span>
        <p className="text-tertiary text-11 font-medium">{t("automations.action.input_label")}</p>
      </div>
      <CustomSelect
        customButton={
          <span
            className={cn(
              "w-full px-4 py-1.5 rounded-md border-[0.5px] border-subtle-1 hover:bg-layer-transparent-hover text-left flex items-center gap-2 cursor-pointer transition-colors",
              {
                "text-placeholder border-accent-strong": !value,
                "cursor-not-allowed text-tertiary bg-layer-disabled": isDisabled,
              }
            )}
          >
            <span className="flex-grow">
              {selectedValue ? t(selectedValue.labelI18nKey) : t("automations.action.input_placeholder")}
            </span>
            <ChevronDownIcon className="flex-shrink-0 size-3" />
          </span>
        }
        customButtonClassName="w-full"
        value={value}
        onChange={onChange}
        disabled={isDisabled}
      >
        {filteredOptions.map((option) => (
          <CustomSelect.Option key={option.value} value={option.value}>
            <span className="flex items-center gap-2">
              <AutomationActionHandlerIcon iconKey={option.iconKey} />
              {t(option.labelI18nKey)}
            </span>
          </CustomSelect.Option>
        ))}
      </CustomSelect>
    </div>
  );
}
