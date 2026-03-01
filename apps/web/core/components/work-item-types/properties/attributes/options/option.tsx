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

import type { FC } from "react";
import { useEffect, useState } from "react";
import { isEqual } from "lodash-es";
import { observer } from "mobx-react";
import { InfoIcon } from "@plane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssuePropertyOption, TIssuePropertyOptionCreateUpdateData } from "@plane/types";
import { Input } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web hooks
import { usePropertyOptions } from "@/plane-web/hooks/store";

type TIssuePropertyOptionItem = {
  optionId?: string;
  propertyOptionData: TIssuePropertyOptionCreateUpdateData;
  updateOptionData: (value: TIssuePropertyOptionCreateUpdateData) => void;
  scrollIntoNewOptionView: () => void;
  error?: string;
};

export const IssuePropertyOptionItem = observer(function IssuePropertyOptionItem(props: TIssuePropertyOptionItem) {
  const { optionId, propertyOptionData, updateOptionData, scrollIntoNewOptionView, error: optionsError } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { propertyOptions } = usePropertyOptions();
  // derived values
  const { key, ...propertyOptionCreateData } = propertyOptionData;
  // states
  const [error, setError] = useState<string | undefined>(optionsError);
  const [optionData, setOptionData] = useState<Partial<TIssuePropertyOption>>(propertyOptionCreateData);

  useEffect(() => {
    if (optionId && !optionData.name)
      setError("work_item_types.settings.properties.attributes.option.form.errors.name.required");
    else setError(optionsError ?? undefined);
  }, [optionId, optionData, optionsError]);

  const checkForDuplicate = ({ identifier, value }: { identifier: string | undefined; value: string }) => {
    if (!value) return;
    // check for duplicate option name
    const isDuplicate = propertyOptions.find(
      (option) => option.id !== identifier && option.key !== identifier && option.name === value
    );
    if (isDuplicate) setError("work_item_types.settings.properties.attributes.option.form.errors.name.integrity");
    else setError(undefined);
    return isDuplicate;
  };

  // handle create/ update operation
  const handleCreateUpdate = async () => {
    // return if no change in data
    if (isEqual(propertyOptionCreateData.name, optionData.name)) return;
    // trim option name
    const optionDataToUpdate = { ...optionData, name: optionData.name?.trim() };
    setOptionData(optionDataToUpdate);
    // return if option name is same as previous or empty
    if (!optionDataToUpdate.name) return;
    // check for duplicate option name
    if (checkForDuplicate({ identifier: optionDataToUpdate.id ?? key, value: optionDataToUpdate.name })) return;
    // handle option data update
    updateOptionData({ key, ...optionDataToUpdate });
  };

  // handle changes in option local data
  const handleOptionDataChange = <T extends keyof TIssuePropertyOption>(key: T, value: TIssuePropertyOption[T]) => {
    // update property data
    setOptionData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="relative w-full flex items-center">
      <Input
        id={`option-${optionId}-${key}`}
        value={optionData.name}
        onChange={(e) => handleOptionDataChange("name", e.target.value)}
        onKeyDown={(e) => {
          if (["Enter", "Tab"].includes(e.key) && !!optionData.name) {
            e.currentTarget.blur();
            scrollIntoNewOptionView();
          }
        }}
        onBlur={() => handleCreateUpdate()}
        placeholder={t("work_item_types.settings.properties.attributes.option.create_update.form.placeholder")}
        className={cn("w-full text-13 bg-surface-1 border-[0.5px] rounded", {
          "border-strong": !error,
        })}
        inputSize="xs"
        hasError={Boolean(error)}
      />
      {Boolean(error) && typeof error === "string" && (
        <Tooltip tooltipContent={t(error)} className="text-caption-md-regular" position="left">
          <InfoIcon className="absolute right-1.5 h-3 w-3 stroke-danger hover:cursor-pointer" />
        </Tooltip>
      )}
    </div>
  );
});
