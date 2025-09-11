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
  automationId: string;
  projectId: string;
  workspaceSlug: string;
  children: React.ReactNode;
};

export const AutomationsDetailsWrapper: React.FC<Props> = observer((props) => {
  const { automationId, projectId, workspaceSlug, children } = props;
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const {
    projectAutomations: { fetchAutomationDetails },
  } = useAutomations();
  // derived values
  const isProjectAutomationsEnabled = useFlag(workspaceSlug, E_FEATURE_FLAGS.PROJECT_AUTOMATIONS);
  const hasProjectAdminPermissions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  // fetching automations details
  useSWR(
    workspaceSlug && projectId && automationId && isProjectAutomationsEnabled && hasProjectAdminPermissions
      ? ["automations", workspaceSlug, projectId, automationId, isProjectAutomationsEnabled, hasProjectAdminPermissions]
      : null,
    () => fetchAutomationDetails(workspaceSlug, projectId, automationId)
  );

  return <>{children}</>;
});
