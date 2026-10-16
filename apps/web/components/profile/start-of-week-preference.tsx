/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { START_OF_THE_WEEK_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Select, SelectDropdownPlacementContext } from "@plane/blocks/select";
import { setToast } from "@plane/blocks/toast";
// components
import { SettingsControlItem } from "@/components/settings/control-item";
// hooks
import { useUserProfile } from "@/hooks/store/user";

type TStartOfWeekOption = (typeof START_OF_THE_WEEK_OPTIONS)[number];

// The dropdown opens flush with the control's right edge, as `placement="bottom-end"` did.
const DROPDOWN_PLACEMENT = { side: "bottom", align: "end" } as const;

export const StartOfWeekPreference = observer(function StartOfWeekPreference(props: {
  option: { title: string; description: string };
}) {
  // hooks
  const { data: userProfile, updateUserProfile } = useUserProfile();
  const { t } = useTranslation();

  const handleStartOfWeekChange = async (val: number) => {
    try {
      await updateUserProfile({ start_of_the_week: val });
      setToast({ type: "success", title: "Success", message: "First day of the week updated successfully" });
    } catch (_error) {
      setToast({ type: "error", title: "Update failed", message: "Please try again later." });
    }
  };

  // derived values
  const selectedOption =
    START_OF_THE_WEEK_OPTIONS.find((option) => option.value === userProfile.start_of_the_week) ?? null;

  return (
    <SettingsControlItem
      title={props.option.title}
      description={props.option.description}
      control={
        <SelectDropdownPlacementContext.Provider value={DROPDOWN_PLACEMENT}>
          <Select<TStartOfWeekOption>
            getValues={() => START_OF_THE_WEEK_OPTIONS}
            value={selectedOption}
            onChange={(val) => void handleStartOfWeekChange(Number(val))}
            getOptionValue={(option) => String(option.value)}
            getOptionLabel={(option) => t(option.i18n_label)}
            showSearch={false}
            pinSelected={false}
            contentSizing="anchor"
          >
            <Select.Trigger<TStartOfWeekOption> variant="select-md" className="w-42 max-w-full border-subtle-1">
              {(options) => (
                <span className="min-w-0 grow truncate text-left">{options[0] && t(options[0].i18n_label)}</span>
              )}
            </Select.Trigger>
          </Select>
        </SelectDropdownPlacementContext.Provider>
      }
    />
  );
});
