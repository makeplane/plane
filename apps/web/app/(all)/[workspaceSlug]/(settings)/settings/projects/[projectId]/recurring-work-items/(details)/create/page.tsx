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
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// plane web imports
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { IssueModalProvider } from "@/components/issues/issue-modal/context/provider";
import { CreateUpdateRecurringWorkItem } from "@/components/recurring-work-items/settings/create-update/root";
import { RecurringWorkItemsUpgrade } from "@/components/recurring-work-items/settings/upgrade";
import type { Route } from "./+types/page";

function CreateRecurringWorkItemPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, projectId } = params;
  // plane hooks
  const { t } = useTranslation();

  return (
    <WithFeatureFlagHOC
      workspaceSlug={workspaceSlug}
      flag={E_FEATURE_FLAGS.RECURRING_WORKITEMS}
      fallback={<RecurringWorkItemsUpgrade />}
    >
      <div className="flex items-center justify-between border-b border-subtle-1 pb-3 tracking-tight w-full">
        <div>
          <h3 className="text-18 font-medium">{t("recurring_work_items.settings.new_recurring_work_item")}</h3>
        </div>
      </div>
      <IssueModalProvider>
        <CreateUpdateRecurringWorkItem workspaceSlug={workspaceSlug} projectId={projectId} />
      </IssueModalProvider>
    </WithFeatureFlagHOC>
  );
}

export default observer(CreateRecurringWorkItemPage);
