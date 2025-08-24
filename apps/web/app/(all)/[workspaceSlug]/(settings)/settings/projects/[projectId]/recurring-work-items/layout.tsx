"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserProjectRoles } from "@plane/types";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// store hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import { useRecurringWorkItems } from "@/plane-web/hooks/store/recurring-work-items/use-recurring-work-items";
import { useFlag } from "@/plane-web/hooks/store/use-flag";

type TRecurringWorkItemsProjectSettingsLayout = {
  children: React.ReactNode;
};

const RecurringWorkItemsProjectSettingsLayout = observer((props: TRecurringWorkItemsProjectSettingsLayout) => {
  const { children } = props;
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const projectId = routerProjectId?.toString();
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { getProjectById } = useProject();
  const { fetchRecurringWorkItems } = useRecurringWorkItems();
  // derived values
  const isRecurringWorkItemsEnabled = useFlag(workspaceSlug, "RECURRING_WORKITEMS");
  const currentProjectDetails = getProjectById(projectId);
  const hasMemberLevelPermission = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  // fetching recurring work items
  useSWR(
    workspaceSlug && isRecurringWorkItemsEnabled
      ? ["recurringWorkItems", workspaceSlug, projectId, isRecurringWorkItemsEnabled]
      : null,
    workspaceSlug && projectId && isRecurringWorkItemsEnabled
      ? () => fetchRecurringWorkItems(workspaceSlug, projectId)
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (!workspaceSlug || !currentProjectDetails?.id) return <></>;

  if (workspaceUserInfo && !hasMemberLevelPermission) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  return <SettingsContentWrapper>{children}</SettingsContentWrapper>;
});

export default RecurringWorkItemsProjectSettingsLayout;
