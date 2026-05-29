import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { usePowerK } from "@/hooks/store/use-power-k";
import { useUser } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { ProjectLevelModals } from "@/plane-web/components/command-palette/modals/project-level";
import { WorkItemLevelModals } from "@/plane-web/components/command-palette/modals/work-item-level";
import { WorkspaceLevelModals } from "@/plane-web/components/command-palette/modals/workspace-level";
// local imports
import { useProjectsAppPowerKCommands } from "./config/commands";
import type { TPowerKCommandConfig, TPowerKContext } from "./core/types";
import { GlobalShortcutsProvider } from "./global-shortcuts";
import { ProjectsAppPowerKCommandsList } from "./ui/modal/commands-list";
import { ProjectsAppPowerKModalWrapper } from "./ui/modal/wrapper";

/**
 * Projects App PowerK provider
 */
export const ProjectsAppPowerKProvider = observer(function ProjectsAppPowerKProvider() {
  // router
  const router = useAppRouter();
  const params = useParams();
  const { workspaceSlug, projectId: routerProjectId, workItem: workItemIdentifier } = params;
  // states
  const [activeCommand, setActiveCommand] = useState<TPowerKCommandConfig | null>(null);
  const [shouldShowContextBasedActions, setShouldShowContextBasedActions] = useState(true);
  // store hooks
  const { activeContext, isPowerKModalOpen, togglePowerKModal, setActivePage } = usePowerK();
  const { data: currentUser } = useUser();
  // derived values
  const {
    issue: { getIssueById, getIssueIdByIdentifier },
  } = useIssueDetail();
  // derived values
  const workItemId = workItemIdentifier ? getIssueIdByIdentifier(workItemIdentifier.toString()) : undefined;
  const workItemDetails = workItemId ? getIssueById(workItemId) : undefined;
  const projectId: string | string[] | undefined | null = routerProjectId ?? workItemDetails?.project_id;
  const commands = useProjectsAppPowerKCommands();
  // Build command context from props and store
  const context: TPowerKContext = useMemo(
    () => ({
      currentUserId: currentUser?.id,
      activeCommand,
      activeContext,
      shouldShowContextBasedActions,
      setShouldShowContextBasedActions,
      params: {
        ...params,
        projectId,
      },
      router,
      closePalette: () => togglePowerKModal(false),
      setActiveCommand,
      setActivePage,
    }),
    [
      currentUser?.id,
      activeCommand,
      activeContext,
      shouldShowContextBasedActions,
      params,
      projectId,
      router,
      togglePowerKModal,
      setActivePage,
    ]
  );

  return (
    <>
      <GlobalShortcutsProvider context={context} commands={commands} />
      {workspaceSlug && <WorkspaceLevelModals workspaceSlug={workspaceSlug.toString()} />}
      {workspaceSlug && projectId && (
        <ProjectLevelModals workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
      )}
      <WorkItemLevelModals workItemIdentifier={workItemIdentifier?.toString()} />
      <ProjectsAppPowerKModalWrapper
        commandsListComponent={ProjectsAppPowerKCommandsList}
        context={context}
        isOpen={isPowerKModalOpen}
        onClose={() => togglePowerKModal(false)}
      />
    </>
  );
});
