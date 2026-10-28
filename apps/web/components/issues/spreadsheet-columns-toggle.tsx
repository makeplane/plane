/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { PreferencesOutline } from "@makeplane/propel/icons";
// plane imports
import { Select } from "@plane/blocks/select";
import { SPREADSHEET_PROPERTY_DETAILS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IIssueDisplayProperties } from "@plane/types";
// local imports
import { SpreadSheetPropertyIcon } from "./issue-layouts/utils";

type TColumnOption = {
  key: keyof IIssueDisplayProperties;
  label: string;
  icon: string | undefined;
};

type Props = {
  /** The spreadsheet's built-in columns, already narrowed to the ones this project can show. */
  columns: (keyof IIssueDisplayProperties)[];
  displayProperties: IIssueDisplayProperties;
  handleDisplayPropertiesUpdate: (properties: Partial<IIssueDisplayProperties>) => void;
  isEstimateEnabled: boolean;
  isEpic?: boolean;
};

/**
 * Column picker for the spreadsheet's sticky config column. It flips the same display properties the
 * header's Display menu does, so both stay in sync through the issue filter store.
 */
export const SpreadsheetColumnsToggle = observer(function SpreadsheetColumnsToggle(props: Props) {
  const { columns, displayProperties, handleDisplayPropertiesUpdate, isEstimateEnabled, isEpic = false } = props;
  // i18n
  const { t } = useTranslation();

  const options: TColumnOption[] = columns
    .filter((key) => key !== "estimate" || isEstimateEnabled)
    .map((key) => {
      const details = SPREADSHEET_PROPERTY_DETAILS[key];
      // Matches the column header, which names the sub-item count after the epic's work items.
      const label =
        key === "sub_issue_count" && isEpic ? t("issue.label", { count: 2 }) : details ? t(details.i18n_title) : key;
      return { key, label, icon: details?.icon };
    });

  const selectedKeys = options.filter((option) => !!displayProperties[option.key]).map((option) => option.key);

  const handleChange = (nextKeys: string[]) => {
    const next = new Set(nextKeys);
    const updates: Partial<IIssueDisplayProperties> = {};
    options.forEach(({ key }) => {
      const isVisible = next.has(key);
      if (!!displayProperties[key] !== isVisible) updates[key] = isVisible;
    });
    if (Object.keys(updates).length > 0) handleDisplayPropertiesUpdate(updates);
  };

  return (
    <Select<TColumnOption>
      multiple
      valueIds={selectedKeys}
      onChange={handleChange}
      getValues={() => options}
      getOptionValue={(option) => option.key}
      getOptionLabel={(option) => option.label}
      getOptionIcon={(option) =>
        option.icon ? (
          <SpreadSheetPropertyIcon iconKey={option.icon} className="size-4 shrink-0 text-secondary" />
        ) : (
          <span className="size-4 shrink-0" />
        )
      }
      placeholder={t("common.properties")}
      searchPlaceholder={t("search")}
      emptyMessage={t("no_matching_results")}
      // Keep the columns in table order; floating the checked ones up would reshuffle the list.
      pinSelected={false}
    >
      {/* Icon triggers render `prependIcon` only; the placeholder names the combobox for screen readers. */}
      <Select.Trigger
        variant="icon-lg"
        prependIcon={<PreferencesOutline className="size-4 text-secondary" />}
        className="rounded-md hover:bg-layer-transparent-hover"
      />
    </Select>
  );
});
