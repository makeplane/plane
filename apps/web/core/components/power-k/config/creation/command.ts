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
  | "create_work_item"
  | "create_page"
  | "create_view"
  | "create_cycle"
  | "create_module"
  | "create_project"
  | "create_workspace";

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
    create_work_item: {
      id: "create_work_item",
      type: "action",
      group: "create",
      i18n_title: "power_k.creation_actions.create_work_item",
      icon: LayersIcon,
      shortcut: "c",
      action: () => toggleCreateIssueModal(true),
      isEnabled: () => Boolean(canCreateWorkItem),
      isVisible: () => Boolean(canCreateWorkItem),
      closeOnSelect: true,
    },
    create_page: {
      id: "create_page",
      type: "action",
      group: "create",
      i18n_title: "power_k.creation_actions.create_page",
      icon: FileText,
      shortcut: "d",
      action: () => toggleCreatePageModal({ isOpen: true }),
      isEnabled: () => Boolean(currentProjectDetails?.page_view && canPerformProjectActions),
      isVisible: (context) =>
        Boolean(context.params.projectId && currentProjectDetails?.page_view && canPerformProjectActions),
      closeOnSelect: true,
    },
    create_view: {
      id: "create_view",
      type: "action",
      group: "create",
      i18n_title: "power_k.creation_actions.create_view",
      icon: Layers,
      shortcut: "v",
      action: () => toggleCreateViewModal(true),
      isEnabled: () => Boolean(currentProjectDetails?.issue_views_view && canPerformProjectActions),
      isVisible: (context) =>
        Boolean(context.params.projectId && currentProjectDetails?.issue_views_view && canPerformProjectActions),
      closeOnSelect: true,
    },
    create_cycle: {
      id: "create_cycle",
      type: "action",
      group: "create",
      i18n_title: "power_k.creation_actions.create_cycle",
      icon: ContrastIcon,
      shortcut: "q",
      action: () => toggleCreateCycleModal(true),
      isEnabled: () => Boolean(currentProjectDetails?.cycle_view && canPerformProjectActions),
      isVisible: (context) =>
        Boolean(context.params.projectId && currentProjectDetails?.cycle_view && canPerformProjectActions),
      closeOnSelect: true,
    },
    create_module: {
      id: "create_module",
      type: "action",
      group: "create",
      i18n_title: "power_k.creation_actions.create_module",
      icon: DiceIcon,
      shortcut: "m",
      action: () => toggleCreateModuleModal(true),
      isEnabled: () => Boolean(currentProjectDetails?.module_view && canPerformProjectActions),
      isVisible: (context) =>
        Boolean(context.params.projectId && currentProjectDetails?.module_view && canPerformProjectActions),
      closeOnSelect: true,
    },
    create_project: {
      id: "create_project",
      type: "action",
      group: "create",
      i18n_title: "power_k.creation_actions.create_project",
      icon: FolderPlus,
      shortcut: "p",
      action: () => toggleCreateProjectModal(true),
      isEnabled: () => Boolean(canCreateProject),
      isVisible: () => Boolean(canCreateProject),
      closeOnSelect: true,
    },
    create_workspace: {
      id: "create_workspace",
      type: "action",
      group: "create",
      i18n_title: "power_k.creation_actions.create_workspace",
      icon: SquarePlus,
      shortcut: "w",
      action: (context) => context.router.push("/create-workspace"),
      isEnabled: () => Boolean(!isWorkspaceCreationDisabled),
      isVisible: () => Boolean(!isWorkspaceCreationDisabled),
      closeOnSelect: true,
    },
  };
};
