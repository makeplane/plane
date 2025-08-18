"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Loader as Spinner } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { IssueActivityLoader } from "@/components/issues/issue-detail/issue-activity/loader";
import { ActivitySortRoot } from "@/components/issues/issue-detail/issue-activity/sort-root";
// plane web imports
import { useRecurringWorkItemActivity } from "@/plane-web/hooks/store/recurring-work-items/use-recurring-work-item-activity";
// local imports
import { RecurringWorkItemActivityItem } from "./list-item";

type TRecurringWorkItemActivityRootProps = {
  projectId: string;
  recurringWorkItemId: string;
  workspaceSlug: string;
};

export const RecurringWorkItemActivityRoot: FC<TRecurringWorkItemActivityRootProps> = observer((props) => {
  const { projectId, recurringWorkItemId, workspaceSlug } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const {
    getRecurringWorkItemActivityLoader,
    getRecurringWorkItemActivities,
    getRecurringWorkItemActivitySortOrder,
    toggleRecurringWorkItemActivitySortOrder,
    fetchRecurringWorkItemActivities,
  } = useRecurringWorkItemActivity();
  // derived values
  const recurringWorkItemActivityLoader = getRecurringWorkItemActivityLoader(recurringWorkItemId);
  const recurringWorkItemActivities = getRecurringWorkItemActivities(recurringWorkItemId);
  const recurringWorkItemActivitySortOrder = getRecurringWorkItemActivitySortOrder();
  const isInitializing = recurringWorkItemActivityLoader === "init-loader";
  const isMutating = recurringWorkItemActivityLoader === "mutation";

  // fetching recurring work item activities
  useSWR(
    workspaceSlug && projectId ? ["recurringWorkItemActivity", workspaceSlug, projectId, recurringWorkItemId] : null,
    workspaceSlug && projectId
      ? () => fetchRecurringWorkItemActivities(workspaceSlug, projectId, recurringWorkItemId)
      : null
  );

  return (
    <div className="relative flex flex-col gap-y-2 h-full overflow-hidden border-t border-custom-border-200 pt-4">
      <div className="flex gap-2 items-center justify-between pb-2">
        <span className="text-lg font-medium">{t("common.activity")}</span>
        <span className="flex items-center gap-2">
          {isMutating ? <Spinner size={12} className="animate-spin" /> : null}
          <ActivitySortRoot
            sortOrder={recurringWorkItemActivitySortOrder}
            toggleSort={toggleRecurringWorkItemActivitySortOrder}
            className="py-1"
            iconClassName="size-3"
          />
        </span>
      </div>
      <div className="flex-grow overflow-y-auto vertical-scrollbar scrollbar-sm">
        <div className="space-y-3">
          {isInitializing ? (
            <IssueActivityLoader />
          ) : (
            <div>
              {recurringWorkItemActivities &&
                recurringWorkItemActivities.map((activity, index) => (
                  <RecurringWorkItemActivityItem
                    key={activity.id}
                    activity={activity}
                    ends={index === 0 ? "top" : index === recurringWorkItemActivities.length - 1 ? "bottom" : undefined}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
