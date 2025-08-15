"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
// plane web imports
import { useTranslation } from "@plane/i18n";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { IssueModalProvider } from "@/plane-web/components/issues/issue-modal/provider";
import { CreateUpdateRecurringWorkItem } from "@/plane-web/components/recurring-work-items/settings/create-update/root";
import { RecurringWorkItemsUpgrade } from "@/plane-web/components/recurring-work-items/settings/upgrade";

const UpdateRecurringWorkItemPage = observer(() => {
  // router
  const {
    workspaceSlug: routerWorkspaceSlug,
    projectId: routerProjectId,
    recurringWorkItemId: routerRecurringWorkItemId,
  } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const projectId = routerProjectId?.toString();
  const recurringWorkItemId = routerRecurringWorkItemId?.toString();
  // plane hooks
  const { t } = useTranslation();

  return (
    <WithFeatureFlagHOC
      workspaceSlug={workspaceSlug}
      flag={E_FEATURE_FLAGS.RECURRING_WORKITEMS}
      fallback={<RecurringWorkItemsUpgrade />}
    >
      <div className="flex items-center justify-between border-b border-custom-border-200 pb-3 tracking-tight w-full">
        <div>
          <h3 className="text-xl font-medium">{t("recurring_work_items.settings.update_recurring_work_item")}</h3>
        </div>
      </div>
      <IssueModalProvider>
        <CreateUpdateRecurringWorkItem
          projectId={projectId}
          recurringWorkItemId={recurringWorkItemId}
          workspaceSlug={workspaceSlug}
        />
      </IssueModalProvider>
    </WithFeatureFlagHOC>
  );
});

export default UpdateRecurringWorkItemPage;
