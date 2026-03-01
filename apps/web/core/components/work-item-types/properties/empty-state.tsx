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

// plane imports
import { useTranslation } from "@plane/i18n";
import { WorkItemsIcon } from "@plane/propel/icons";

export function IssueTypePropertiesEmptyState() {
  // plane hooks
  const { t } = useTranslation();

  return (
    <div className="w-full px-3 py-1 relative flex justify-center items-center">
      <div className="flex flex-col items-center">
        <div className="flex-shrink-0 grid h-24 w-24 place-items-center rounded-full bg-layer-1 mb-4">
          <WorkItemsIcon className="h-14 w-14 text-placeholder" strokeWidth="1.5" />
        </div>
        <div className="text-primary font-medium">{t("work_item_types.settings.properties.empty_state.title")}</div>
        <div className="text-13 text-tertiary">{t("work_item_types.settings.properties.empty_state.description")}</div>
      </div>
    </div>
  );
}
