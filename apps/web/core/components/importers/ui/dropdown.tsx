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

import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import { CustomSearchSelect } from "@plane/ui";
// silo types
import type { TDropdown } from "@/types/importers";

export function Dropdown<T>(props: TDropdown<T>) {
  const { dropdownOptions, onChange, value, placeHolder, disabled = false, iconExtractor, queryExtractor } = props;
  const { t } = useTranslation();
  // derived values
  const className = "";
  const buttonClassName = "w-full min-h-8 h-full";
  const optionsClassName = "";

  const selectedState = dropdownOptions.find((option) => option.key === value);
  const dropdownLabel = selectedState ? (
    <Tooltip tooltipContent="State" position={"top"} className="ml-4">
      <div className="relative flex items-center gap-2 truncate">
        {iconExtractor && selectedState && iconExtractor(selectedState.data as T)}
        <div className="flex-grow truncate line-clamp-1">{selectedState?.label}</div>
      </div>
    </Tooltip>
  ) : placeHolder ? (
    placeHolder
  ) : (
    t("common.select")
  );
  const dropdownOptionsRender = (dropdownOptions ? Object.values(dropdownOptions).flat() : []).map((dropdownItem) => ({
    value: dropdownItem?.value,
    query: queryExtractor ? queryExtractor(dropdownItem.data as T) : `${dropdownItem?.label}`,
    content: (
      <div className="relative flex items-center gap-2 truncate">
        {iconExtractor && iconExtractor(dropdownItem.data as T)}
        <div className="flex-grow truncate line-clamp-1">{dropdownItem?.label}</div>
      </div>
    ),
  }));

  return (
    <CustomSearchSelect
      label={dropdownLabel}
      options={dropdownOptionsRender}
      value={value}
      onChange={onChange}
      buttonClassName={buttonClassName}
      className={className}
      disabled={disabled}
      optionsClassName={optionsClassName}
      noChevron
    />
  );
}
