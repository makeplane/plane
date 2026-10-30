/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { observer } from "mobx-react";
// plane imports
import { START_OF_THE_WEEK_OPTIONS } from "@plane/constants";
import { Select, SelectDropdownPlacementContext } from "@plane/blocks/select";
import { setToast } from "@plane/blocks/toast";
import type { EStartOfTheWeek } from "@plane/types";
// components
import { SettingsControlItem } from "@/components/settings/control-item";
// hooks
import { useUserProfile } from "@/hooks/store/user";

type TStartOfWeekOption = (typeof START_OF_THE_WEEK_OPTIONS)[number];

const getStartOfWeekOption = (startOfWeek: EStartOfTheWeek) =>
  START_OF_THE_WEEK_OPTIONS.find((option) => option.value === startOfWeek) ?? null;

// The dropdown opens flush with the control's right edge, as `placement="bottom-end"` did.
const DROPDOWN_PLACEMENT = { side: "bottom", align: "end" } as const;

export const StartOfWeekPreference = observer(function StartOfWeekPreference(props: {
  option: { title: string; description: string };
}) {
  const { t } = useTranslation();

  // hooks
  const { data: userProfile, updateUserProfile } = useUserProfile();

  const handleStartOfWeekChange = async (val: number) => {
    try {
      await updateUserProfile({ start_of_the_week: val });
      setToast({
        type: "success",
        title: t("success"),
        message: t("web_ui.first_day_of_the_week_updated_successfully"),
      });
    } catch (_error) {
      setToast({ type: "error", title: t("web_ui.update_failed"), message: t("web_ui.please_try_again_later") });
    }
  };

  // derived values
  const selectedOption = getStartOfWeekOption(userProfile.start_of_the_week);

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
            getOptionLabel={(option) => option.label}
            showSearch={false}
            pinSelected={false}
            contentSizing="anchor"
          >
            <Select.Trigger<TStartOfWeekOption> variant="select-md" className="w-42 max-w-full border-subtle-1">
              {(options) => <span className="min-w-0 grow truncate text-left">{options[0]?.label}</span>}
            </Select.Trigger>
          </Select>
        </SelectDropdownPlacementContext.Provider>
      }
    />
  );
});
