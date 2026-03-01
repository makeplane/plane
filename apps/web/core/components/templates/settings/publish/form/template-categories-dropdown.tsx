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

import { useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ChevronDownIcon } from "@plane/propel/icons";
import { MultiSelectDropdown } from "@plane/ui";
import { cn, joinWithConjunction } from "@plane/utils";
// plane web imports
import { useTemplateHelper } from "@/plane-web/hooks/store/templates/use-template-helper";
type TSelectCategoriesProps = {
  value: string[];
  handleChange: (value: string[]) => void;
  buttonContainerClassName?: string;
};

export const TemplateCategoriesDropdown = observer(function TemplateCategoriesDropdown(props: TSelectCategoriesProps) {
  const { value, handleChange, buttonContainerClassName } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { sortedActiveTemplateCategories, getTemplateCategoryById } = useTemplateHelper();
  // derived values
  const options = sortedActiveTemplateCategories.map((category) => ({
    data: category.id,
    value: category.name,
  }));
  const selectedCategoriesNames = useMemo(
    () => value.map((categoryId) => getTemplateCategoryById(categoryId)?.name ?? "").filter(Boolean),
    [value, getTemplateCategoryById]
  );

  return (
    <MultiSelectDropdown
      value={value}
      options={options}
      onChange={(value) => handleChange(value)}
      keyExtractor={(option) => option.data}
      containerClassName="h-auto"
      buttonContainerClassName={buttonContainerClassName}
      buttonContent={(isOpen) => (
        <span
          className={cn("flex items-center justify-between gap-1 text-caption-md-regular w-full truncate", {
            "text-placeholder": selectedCategoriesNames.length === 0,
          })}
        >
          <span className="truncate">
            {selectedCategoriesNames.length > 0
              ? joinWithConjunction(selectedCategoriesNames)
              : t("templates.settings.form.publish.category.placeholder")}
          </span>
          <ChevronDownIcon
            height={16}
            width={16}
            className={cn("transition-all duration-300 flex-shrink-0", isOpen ? "rotate-180" : "rotate-0")}
          />
        </span>
      )}
    />
  );
});
