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

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { ChevronDownIcon } from "@plane/propel/icons";
// plane imports
import { MultiSelectDropdown } from "@plane/ui";
import { cn } from "@plane/utils";
import { useApplications } from "@/plane-web/hooks/store";
// plane web imports

type TSelectCategoriesProps = {
  value: string[];
  handleChange: (value: string[]) => void;
};

const COMMON_DROPDOWN_CONTAINER_CLASSNAME = "bg-surface-1 border border-subtle-1 rounded-md px-2 py-1";

export const SelectCategories = observer(function SelectCategories(props: TSelectCategoriesProps) {
  const { value, handleChange } = props;
  // plane hooks
  const { t } = useTranslation();
  const { allApplicationCategories } = useApplications();
  // derived values
  const options = allApplicationCategories.map((category) => ({
    data: category.id,
    value: category.name,
  }));

  return (
    <MultiSelectDropdown
      value={value}
      options={options}
      onChange={(value) => handleChange(value)}
      keyExtractor={(option) => option.data}
      buttonContainerClassName={COMMON_DROPDOWN_CONTAINER_CLASSNAME}
      buttonContent={(isOpen, val) => (
        <span className="flex items-center justify-between gap-1 text-13 text-tertiary w-36">
          {val && val.length > 0
            ? `${val.length} ${t("workspace_settings.settings.applications.categories")}`
            : t("workspace_settings.settings.applications.categories")}
          <ChevronDownIcon height={16} width={16} className={cn(isOpen ? "rotate-180 ml-auto" : "rotate-0 ml-auto")} />
        </span>
      )}
      disableSearch
    />
  );
});
