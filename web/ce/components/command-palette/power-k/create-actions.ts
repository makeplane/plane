import { FileText, FolderPlus, Layers, SquarePlus } from "lucide-react";
// plane types
import { TPowerKCreateAction, TPowerKCreateActionKeys } from "@plane/types";
// plane ui
import { ContrastIcon, DiceIcon, LayersIcon } from "@plane/ui";
// lib
import { TAppRouterInstance } from "@/lib/n-progress/AppProgressBar";
import { store } from "@/lib/store-context";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants";

export const commonCreateActions = (
  router: TAppRouterInstance
): Record<TPowerKCreateActionKeys, TPowerKCreateAction> => {
  // store
  const {
    canPerformAnyCreateAction,
    permission: { allowPermissions },
  } = store.user;
  const { workspaceProjectIds, currentProjectDetails } = store.projectRoot.project;
  const {
    toggleCreateCycleModal,
    toggleCreateIssueModal,
    toggleCreateModuleModal,
    toggleCreatePageModal,
    toggleCreateProjectModal,
    toggleCreateViewModal,
  } = store.commandPalette;
  // derived values
  const canCreateIssue = workspaceProjectIds && workspaceProjectIds.length > 0;
  const canCreateProject = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const options: Record<TPowerKCreateActionKeys, TPowerKCreateAction> = {
    issue: {
      key: "issue",
      onClick: () => toggleCreateIssueModal(true),
      label: "New issue",
      icon: LayersIcon,
      shortcut: "C",
      shouldRender: canCreateIssue,
    },
    page: {
      key: "page",
      onClick: () => toggleCreatePageModal({ isOpen: true }),
      label: "New page",
      icon: FileText,
      shortcut: "D",
      shouldRender: currentProjectDetails?.page_view && canPerformAnyCreateAction,
    },
    view: {
      key: "view",
      onClick: () => toggleCreateViewModal(true),
      label: "New view",
      icon: Layers,
      shortcut: "V",
      shouldRender: currentProjectDetails?.issue_views_view && canPerformAnyCreateAction,
    },
    cycle: {
      key: "cycle",
      onClick: () => toggleCreateCycleModal(true),
      label: "New cycle",
      icon: ContrastIcon,
      shortcut: "Q",
      shouldRender: currentProjectDetails?.cycle_view && canPerformAnyCreateAction,
    },
    module: {
      key: "module",
      onClick: () => toggleCreateModuleModal(true),
      label: "New module",
      icon: DiceIcon,
      shortcut: "M",
      shouldRender: currentProjectDetails?.module_view && canPerformAnyCreateAction,
    },
    project: {
      key: "project",
      onClick: () => toggleCreateProjectModal(true),
      label: "New project",
      icon: FolderPlus,
      shortcut: "P",
      shouldRender: canCreateProject,
    },
    workspace: {
      key: "workspace",
      onClick: () => router.push("/create-workspace"),
      label: "New workspace",
      icon: SquarePlus,
    },
  };

  return options;
};

export const getCreateActionsList = (router: TAppRouterInstance): TPowerKCreateAction[] => {
  const optionsList = commonCreateActions(router);
  return [
    optionsList["issue"],
    optionsList["page"],
    optionsList["view"],
    optionsList["cycle"],
    optionsList["module"],
    optionsList["project"],
    optionsList["workspace"],
  ];
};
