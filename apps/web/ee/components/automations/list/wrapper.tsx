"use client";

import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { E_FEATURE_FLAGS, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
// plane web imports
import { useUserPermissions } from "@/hooks/store/user/user-permissions";
import { useFlag } from "@/plane-web/hooks/store";
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

type Props = {
  projectId: string;
  workspaceSlug: string;
  children: React.ReactNode;
};

export const AutomationsListWrapper: React.FC<Props> = observer((props) => {
  const { projectId, workspaceSlug, children } = props;
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const {
    projectAutomations: { fetchAutomations },
  } = useAutomations();
  // derived values
  const isProjectAutomationsEnabled = useFlag(workspaceSlug, E_FEATURE_FLAGS.PROJECT_AUTOMATIONS);
  const hasProjectAdminPermissions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  // fetching automations list
  useSWR(
    workspaceSlug && projectId && isProjectAutomationsEnabled && hasProjectAdminPermissions
      ? ["automations", workspaceSlug, projectId, isProjectAutomationsEnabled, hasProjectAdminPermissions]
      : null,
    () => fetchAutomations(workspaceSlug, projectId)
  );

  return <>{children}</>;
});
