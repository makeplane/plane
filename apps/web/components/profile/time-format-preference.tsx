/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { TIME_FORMAT_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Select, SelectDropdownPlacementContext } from "@plane/blocks/select";
import { setToast } from "@plane/blocks/toast";
import type { TTimeFormat } from "@plane/types";
// components
import { SettingsControlItem } from "@/components/settings/control-item";
// hooks
import { useUserProfile } from "@/hooks/store/user";
import { useTimeFormat } from "@/hooks/use-time-format";

type TTimeFormatOption = { value: TTimeFormat; label: string };

// The dropdown opens flush with the control's right edge, as `placement="bottom-end"` did.
const DROPDOWN_PLACEMENT = { side: "bottom", align: "end" } as const;

export const TimeFormatPreference = observer(function TimeFormatPreference() {
  // hooks
  const { updateUserProfile } = useUserProfile();
  const { timeFormat } = useTimeFormat();
  const { t } = useTranslation();

  const handleTimeFormatChange = async (val: TTimeFormat) => {
    try {
      await updateUserProfile({ time_format: val });
      setToast({ type: "success", title: "Success", message: t("time_format.update_success") });
    } catch (_error) {
      setToast({ type: "error", title: "Update failed", message: "Please try again later." });
    }
  };

  // derived values
  const options: TTimeFormatOption[] = TIME_FORMAT_OPTIONS.map((option) => ({
    value: option.value,
    label: t(option.i18n_label),
  }));
  // Members who never picked one see the workspace default selected
  const selectedOption = options.find((option) => option.value === timeFormat) ?? null;

  return (
    <SettingsControlItem
      title={t("time_format.label")}
      description={t("time_format.description")}
      control={
        <SelectDropdownPlacementContext.Provider value={DROPDOWN_PLACEMENT}>
          <Select<TTimeFormatOption>
            getValues={() => options}
            value={selectedOption}
            onChange={(val) => void handleTimeFormatChange(val as TTimeFormat)}
            getOptionValue={(option) => option.value}
            getOptionLabel={(option) => option.label}
            showSearch={false}
            pinSelected={false}
            contentSizing="anchor"
          >
            <Select.Trigger<TTimeFormatOption> variant="select-md" className="w-42 max-w-full border-subtle-1">
              {(selected) => <span className="min-w-0 grow truncate text-left">{selected[0]?.label}</span>}
            </Select.Trigger>
          </Select>
        </SelectDropdownPlacementContext.Provider>
      }
    />
  );
});
