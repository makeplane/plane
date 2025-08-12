import { FC, useCallback } from "react";
import { observer } from "mobx-react";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
import { IAutomationInstance } from "@/plane-web/store/automations/automation";
// local imports
import { NoAutomationsEmptyState } from "../no-automations";
import { AutomationsTableLoader } from "./table/loader";
import { AutomationsTable } from "./table/root";

type TProps = {
  projectId: string;
};

export const AutomationsListRoot: FC<TProps> = observer((props) => {
  const { projectId } = props;
  // router
  const router = useAppRouter();
  // store hooks
  const {
    projectAutomations: { getProjectAutomations, getIsInitializingAutomations, isAnyAutomationAvailable },
  } = useAutomations();

  // derived values
  const automations = getProjectAutomations(projectId);
  const isInitializingAutomations = getIsInitializingAutomations(projectId);

  // handlers
  const handleAutomationClick = useCallback(
    (automation: IAutomationInstance) => {
      router.push(automation.redirectionLink);
    },
    [router]
  );

  // Show loader while initializing
  if (isInitializingAutomations) {
    return <AutomationsTableLoader />;
  }

  // Show empty state when no automations are available
  if (!isAnyAutomationAvailable) {
    return <NoAutomationsEmptyState />;
  }

  return <AutomationsTable automations={automations} onAutomationClick={handleAutomationClick} />;
});
