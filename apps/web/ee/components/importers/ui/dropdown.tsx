"use client";

import { CustomSearchSelect, Tooltip } from "@plane/ui";
// silo types
import { TDropdown } from "@/plane-web/types/importers";
import { useTranslation } from "@plane/i18n";

export const Dropdown = <T,>(props: TDropdown<T>) => {
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
};
