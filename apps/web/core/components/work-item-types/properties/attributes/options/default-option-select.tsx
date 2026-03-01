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

import React from "react";
import { isEqual } from "lodash-es";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CustomSearchSelect } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
// plane web hooks
import { usePropertyOptions } from "@/plane-web/hooks/store";

type TDefaultOptionSelectProps = {
  isMultiSelect?: boolean;
  isDisabled?: boolean;
};

export const DefaultOptionSelect = observer(function DefaultOptionSelect(props: TDefaultOptionSelectProps) {
  const { isMultiSelect = false, isDisabled = false } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { propertyOptions, handlePropertyOptionsList } = usePropertyOptions();
  // derived values
  const optionsList = propertyOptions.filter((option) => !!option.name);
  const selectedDefaultOptionsIds = optionsList
    .filter((option) => (option.id || option.key) && option.is_default)
    .map((option) => (option.id ?? option.key) as string);
  // states
  const [data, setData] = React.useState<string[]>(selectedDefaultOptionsIds ?? []);

  const customSearchOptions = optionsList.map((option) => ({
    value: option.id ?? option.key,
    query: option.name ?? "",
    content: option.name,
  }));

  const getOptionDetails = (optionId: string) =>
    optionsList.find((option) => option.id === optionId || option.key === optionId);

  const getDisplayName = () => {
    if (isMultiSelect) {
      if (data.length) {
        if (data.length === 1) {
          return getOptionDetails(data[0])?.name;
        } else {
          return t("work_item_types.settings.properties.attributes.option.select.placeholder.multi.variable", {
            count: data.length,
          });
        }
      }
      return t("work_item_types.settings.properties.attributes.option.select.placeholder.multi.default");
    } else {
      if (data.length) {
        return getOptionDetails(data[0])?.name;
      }
      return t("work_item_types.settings.properties.attributes.option.select.placeholder.single");
    }
  };

  const customSearchSelectProps = {
    label: getDisplayName(),
    options: customSearchOptions,
    className: "group w-full flex",
    chevronClassName: "h-3.5 w-3.5 hidden group-hover:inline",
    buttonClassName: cn("rounded-sm text-13 bg-surface-1 border-[0.5px] border-subtle-1", {
      "text-placeholder": !data.length,
    }),
    disabled: isDisabled,
  };

  const onOptionValueChange = (value: string[]) => {
    propertyOptions.map((option) => {
      handlePropertyOptionsList("update", {
        id: option.id,
        key: option.key,
        is_default: value.includes(option.key as string) || value.includes(option.id as string),
      });
    });
  };

  return (
    <>
      {isMultiSelect ? (
        <CustomSearchSelect
          {...customSearchSelectProps}
          value={data || []}
          onChange={(optionIds: string[]) => setData(optionIds)}
          onClose={() => {
            if (!isEqual(data, selectedDefaultOptionsIds)) {
              onOptionValueChange(data);
            }
          }}
          multiple
        />
      ) : (
        <CustomSearchSelect
          {...customSearchSelectProps}
          value={data?.[0] || null}
          onChange={(optionId: string) => {
            const updatedData = optionId && !data?.includes(optionId) ? [optionId] : [];
            setData(updatedData);
            if (!isEqual(updatedData, selectedDefaultOptionsIds)) {
              onOptionValueChange(updatedData);
            }
          }}
          multiple={false}
        />
      )}
    </>
  );
});
