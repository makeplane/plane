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
// components
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
// local imports
import { CreateRecurringWorkItemsButton } from "./create-button";

type TRecurringWorkItemsEmptyStateProps = { workspaceSlug: string; projectId: string };

export const RecurringWorkItemsEmptyState = observer(function RecurringWorkItemsEmptyState(
  props: TRecurringWorkItemsEmptyStateProps
) {
  // derived values
  const { t } = useTranslation();

  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-center h-full w-full">
        <EmptyStateCompact
          assetKey="work-item"
          title={t("settings_empty_state.recurring_work_items.title")}
          description={t("recurring_work_items.settings.description")}
          customButton={
            <CreateRecurringWorkItemsButton
              {...props}
              buttonSize="base"
              buttonI18nLabel="recurring_work_items.empty_state.no_templates.button"
            />
          }
          align="start"
          rootClassName="py-20"
        />
      </div>
    </div>
  );
});
