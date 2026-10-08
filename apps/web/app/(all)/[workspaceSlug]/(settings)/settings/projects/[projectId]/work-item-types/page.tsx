/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";

export default function WorkItemTypesSettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="w-full">
      <h2 className="text-16 font-medium">{t("work_item_types.label")}</h2>
    </div>
  );
}
