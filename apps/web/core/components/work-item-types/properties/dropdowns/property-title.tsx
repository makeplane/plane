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
import type { EIssuePropertyType, TIssueProperty } from "@plane/types";
import { Input, TextArea } from "@plane/ui";
import { cn } from "@plane/utils";

type TPropertyTitleDescriptionInputProps = {
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType>>;
  error?: string;
  onPropertyDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType>[K],
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
    <div className="w-full flex flex-col">
      <Input
        id="display_name"
        type="text"
        mode={error ? "primary" : "true-transparent"}
        placeholder={t("work_item_types.settings.properties.create_update.form.display_name.placeholder")}
        value={propertyDetail.display_name}
        onChange={(e) => onPropertyDetailChange("display_name", e.target.value)}
        className={cn("w-full resize-none text-body-md-medium bg-surface-1 rounded")}
        tabIndex={1}
        hasError={Boolean(error)}
        inputSize="xs"
        required
        autoFocus
      />
      {Boolean(error) && <span className="text-caption-xs-medium text-danger-primary">{error}</span>}
      <TextArea
        id="description"
        mode="true-transparent"
        placeholder={t("work_item_types.settings.properties.create_update.form.description.placeholder")}
        value={propertyDetail.description}
        onChange={(e) => onPropertyDetailChange("description", e.target.value)}
        className={cn(
          "w-full sm:min-h-20 max-h-48 overflow-auto horizontal-scrollbar scrollbar-xs resize-none text-body-xs-regular bg-surface-1"
        )}
        textAreaSize="xs"
        tabIndex={2}
      />
    </div>
  );
});
