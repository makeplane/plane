import { FileText, FolderPlus, Layers, SquarePlus } from "lucide-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { ContrastIcon, DiceIcon, LayersIcon } from "@plane/propel/icons";
// components
import type { TPowerKCommandConfig, TPowerKContext } from "@/components/power-k/core/types";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";
// plane web imports
import { getIsWorkspaceCreationDisabled } from "@/plane-web/helpers/instance.helper";

export type TPowerKCreationCommandKeys =
  | "create-work_item"
  | "create-page"
  | "create-view"
  | "create-cycle"
  | "create-module"
  | "create-project"
  | "create-workspace";

/**
 * Creation commands - Create any entity in the app
 */
export const usePowerKCreationCommandsRecord = (
  context: TPowerKContext
): Record<TPowerKCreationCommandKeys, TPowerKCommandConfig> => {
  // store
  const {
    canPerformAnyCreateAction,
    permission: { allowPermissions },
  } = useUser();
  const { workspaceProjectIds, currentProjectDetails } = useProject();
  const {
    toggleCreateIssueModal,
    toggleCreateProjectModal,
    toggleCreateCycleModal,
    toggleCreateModuleModal,
    toggleCreateViewModal,
    toggleCreatePageModal,
  } = useCommandPalette();
  // derived values
  const canCreateWorkItem = canPerformAnyCreateAction && workspaceProjectIds && workspaceProjectIds.length > 0;
  const canCreateProject = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const canPerformProjectActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    context.params.workspaceSlug?.toString(),
    context.params.projectId?.toString()
  );
  const isWorkspaceCreationDisabled = getIsWorkspaceCreationDisabled();

  return {
    "create-work_item": {
      id: "create-work-item",
      type: "action",
      group: "create",
      i18n_title: "New work item",
      i18n_description: "Create a new work item",
      icon: LayersIcon,
      shortcut: "c",
      action: () => toggleCreateIssueModal(true),
      isEnabled: () => Boolean(canCreateWorkItem),
      isVisible: () => Boolean(canCreateWorkItem),
      closeOnSelect: true,
    },
    "create-page": {
      id: "create-page",
      type: "action",
      group: "create",
      i18n_title: "New page",
      i18n_description: "Create a new page in the current project",
      icon: FileText,
      shortcut: "d",
      action: () => toggleCreatePageModal({ isOpen: true }),
      isEnabled: () => Boolean(currentProjectDetails?.page_view && canPerformProjectActions),
      isVisible: (context) =>
        Boolean(context.params.projectId && currentProjectDetails?.page_view && canPerformProjectActions),
      closeOnSelect: true,
    },
    "create-view": {
      id: "create-view",
      type: "action",
      group: "create",
      i18n_title: "New view",
      i18n_description: "Create a new view in the current project",
      icon: Layers,
      shortcut: "v",
      action: () => toggleCreateViewModal(true),
      isEnabled: () => Boolean(currentProjectDetails?.issue_views_view && canPerformProjectActions),
      isVisible: (context) =>
        Boolean(context.params.projectId && currentProjectDetails?.issue_views_view && canPerformProjectActions),
      closeOnSelect: true,
    },
    "create-cycle": {
      id: "create-cycle",
      type: "action",
      group: "create",
      i18n_title: "New cycle",
      i18n_description: "Create a new cycle in the current project",
      icon: ContrastIcon,
      shortcut: "q",
      action: () => toggleCreateCycleModal(true),
      isEnabled: () => Boolean(currentProjectDetails?.cycle_view && canPerformProjectActions),
      isVisible: (context) =>
        Boolean(context.params.projectId && currentProjectDetails?.cycle_view && canPerformProjectActions),
      closeOnSelect: true,
    },
    "create-module": {
      id: "create-module",
      type: "action",
      group: "create",
      i18n_title: "New module",
      i18n_description: "Create a new module in the current project",
      icon: DiceIcon,
      shortcut: "m",
      action: () => toggleCreateModuleModal(true),
      isEnabled: () => Boolean(currentProjectDetails?.module_view && canPerformProjectActions),
      isVisible: (context) =>
        Boolean(context.params.projectId && currentProjectDetails?.module_view && canPerformProjectActions),
      closeOnSelect: true,
    },
    "create-project": {
      id: "create-project",
      type: "action",
      group: "create",
      i18n_title: "New project",
      i18n_description: "Create a new project in the current workspace",
      icon: FolderPlus,
      shortcut: "p",
      action: () => toggleCreateProjectModal(true),
      isEnabled: () => Boolean(canCreateProject),
      isVisible: () => Boolean(canCreateProject),
      closeOnSelect: true,
    },
    "create-workspace": {
      id: "create-workspace",
      type: "action",
      group: "create",
      i18n_title: "New workspace",
      i18n_description: "Create a new workspace",
      icon: SquarePlus,
      shortcut: "w",
      action: (context) => context.router.push("/create-workspace"),
      isEnabled: () => Boolean(!isWorkspaceCreationDisabled),
      isVisible: () => Boolean(!isWorkspaceCreationDisabled),
      closeOnSelect: true,
    },
  };
};
