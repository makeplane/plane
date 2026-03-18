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
// plane imports
import { useTranslation } from "@plane/i18n";
import type { CustomPropertyType, CustomProperty } from "@plane/types";
import { Input, TextArea } from "@plane/ui";
import { cn } from "@plane/utils";

type TPropertyTitleDescriptionInputProps = {
  propertyDetail: Partial<CustomProperty<CustomPropertyType>>;
  error?: string;
  onPropertyDetailChange: <K extends keyof CustomProperty<CustomPropertyType>>(
    key: K,
    value: CustomProperty<CustomPropertyType>[K],
    shouldSync?: boolean
  ) => void;
};

export const PropertyTitleDescriptionInput = observer(function PropertyTitleDescriptionInput(
  props: TPropertyTitleDescriptionInputProps
) {
  const { propertyDetail, error, onPropertyDetailChange } = props;
  // plane hooks
  const { t } = useTranslation();

  return (
    <div className="w-full flex flex-col gap-2">
      <Input
        id="display_name"
        type="text"
        mode="primary"
        placeholder={t("work_item_types.settings.properties.create_update.form.display_name.placeholder")}
        value={propertyDetail.display_name}
        onChange={(e) => onPropertyDetailChange("display_name", e.target.value)}
        tabIndex={1}
        hasError={Boolean(error)}
        inputSize="sm"
        required
        autoFocus
      />
      {Boolean(error) && <span className="text-caption-xs-medium text-danger-primary">{error}</span>}
      <TextArea
        id="description"
        mode="primary"
        placeholder={t("work_item_types.settings.properties.create_update.form.description.placeholder")}
        value={propertyDetail.description ?? undefined}
        onChange={(e) => onPropertyDetailChange("description", e.target.value)}
        className={cn(
          "w-full sm:min-h-20 max-h-48 overflow-auto horizontal-scrollbar scrollbar-xs resize-none text-body-xs-regular"
        )}
        textAreaSize="sm"
        tabIndex={2}
      />
    </div>
  );
});
