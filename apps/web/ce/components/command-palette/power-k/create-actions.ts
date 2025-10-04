import { FileText, FolderPlus, Layers, SquarePlus } from "lucide-react";
import type { AppRouterInstance } from "@bprogress/next";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { ContrastIcon, DiceIcon, LayersIcon } from "@plane/propel/icons";
// lib
import { store } from "@/lib/store-context";

type TPowerKCreateAction = {
  key: string;
  onClick: () => void;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  shouldRender?: boolean;
};

export const commonCreateActions = (router: AppRouterInstance) => {
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

  const options: Record<string, TPowerKCreateAction> = {
    issue: {
      key: "issue",
      onClick: () => toggleCreateIssueModal(true),
      label: "New work item",
      icon: LayersIcon,
      shortcut: "C",
      shouldRender: Boolean(canCreateIssue),
    },
    page: {
      key: "page",
      onClick: () => toggleCreatePageModal({ isOpen: true }),
      label: "New page",
      icon: FileText,
      shortcut: "D",
      shouldRender: Boolean(currentProjectDetails?.page_view && canPerformAnyCreateAction),
    },
    view: {
      key: "view",
      onClick: () => toggleCreateViewModal(true),
      label: "New view",
      icon: Layers,
      shortcut: "V",
      shouldRender: Boolean(currentProjectDetails?.issue_views_view && canPerformAnyCreateAction),
    },
    cycle: {
      key: "cycle",
      onClick: () => toggleCreateCycleModal(true),
      label: "New cycle",
      icon: ContrastIcon,
      shortcut: "Q",
      shouldRender: Boolean(currentProjectDetails?.cycle_view && canPerformAnyCreateAction),
    },
    module: {
      key: "module",
      onClick: () => toggleCreateModuleModal(true),
      label: "New module",
      icon: DiceIcon,
      shortcut: "M",
      shouldRender: Boolean(currentProjectDetails?.module_view && canPerformAnyCreateAction),
    },
    project: {
      key: "project",
      onClick: () => toggleCreateProjectModal(true),
      label: "New project",
      icon: FolderPlus,
      shortcut: "P",
      shouldRender: Boolean(canCreateProject),
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

export const getCreateActionsList = (router: AppRouterInstance): TPowerKCreateAction[] => {
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
