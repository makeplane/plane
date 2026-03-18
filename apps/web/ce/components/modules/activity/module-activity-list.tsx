/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { Loader } from "@plane/ui";
import { useTranslation } from "@plane/i18n";
import { useModuleActivity } from "@/hooks/store/use-module-activity";
import { ModuleActivityItem } from "./module-activity-item";

type Props = {
  workspaceSlug: string;
  projectId: string;
  moduleId: string;
};

export const ModuleActivityList = observer(({ workspaceSlug, projectId, moduleId }: Props) => {
  const { t } = useTranslation();
  const { fetchActivities, getActivitiesByModuleId, hasMore, loader } = useModuleActivity();
  const activities = getActivitiesByModuleId(moduleId);

  useEffect(() => {
    if (!activities) {
      fetchActivities(workspaceSlug, projectId, moduleId).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  if (!activities && loader) {
    return (
      <Loader className="space-y-2 py-2">
        <Loader.Item height="28px" />
        <Loader.Item height="28px" />
        <Loader.Item height="28px" />
      </Loader>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <p className="p-1 text-sm text-tertiary">{t("module.activity.no_activities")}</p>
    );
  }

  return (
    <div className="flex flex-col">
      {activities.map((activity) => (
        <ModuleActivityItem key={activity.id} activity={activity} />
      ))}
      {hasMore(moduleId) && (
        <button
          className="mt-1 text-xs font-medium text-accent-primary text-left"
          disabled={loader}
          onClick={() => void fetchActivities(workspaceSlug, projectId, moduleId, true).catch(console.error)}
        >
          {loader ? t("loading") : t("module.activity.load_more")}
        </button>
      )}
    </div>
  );
});
