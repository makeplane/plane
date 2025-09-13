import {
  CYCLE_TRACKER_ELEMENTS,
  MODULE_TRACKER_ELEMENTS,
  PROJECT_PAGE_TRACKER_ELEMENTS,
  PROJECT_TRACKER_ELEMENTS,
  PROJECT_VIEW_TRACKER_ELEMENTS,
  WORK_ITEM_TRACKER_ELEMENTS,
} from "@plane/constants";
import { captureClick } from "@/helpers/event-tracker.helper";
import { LayersIcon, DiceIcon } from "@plane/propel/icons";
import { ContrastIcon, FileText, FolderPlus, Layers } from "lucide-react";
import { CommandAction } from "./registry";

export interface CommandDeps {
  toggleCreateIssueModal: (v: boolean) => void;
  toggleCreateProjectModal: (v: boolean) => void;
  toggleCreatePageModal: (v: { isOpen: boolean }) => void;
  toggleCreateModuleModal: (v: boolean) => void;
  toggleCreateCycleModal: (v: boolean) => void;
  toggleCreateViewModal: (v: boolean) => void;
  toggleBulkDeleteIssueModal: (v: boolean) => void;
  performAnyProjectCreateActions: () => boolean;
  performWorkspaceCreateActions: () => boolean;
  performProjectCreateActions: () => boolean;
  performProjectBulkDeleteActions: () => boolean;
  workspaceSlug?: string;
  projectId?: string;
  hasProjects?: boolean;
}

export const getDefaultCommands = (deps: CommandDeps): CommandAction[] => {
  const {
    toggleCreateIssueModal,
    toggleCreateProjectModal,
    toggleCreatePageModal,
    toggleCreateModuleModal,
    toggleCreateCycleModal,
    toggleCreateViewModal,
    toggleBulkDeleteIssueModal,
    performAnyProjectCreateActions,
    performWorkspaceCreateActions,
    performProjectCreateActions,
    performProjectBulkDeleteActions,
    workspaceSlug,
    projectId,
    hasProjects,
  } = deps;

  const commands: CommandAction[] = [
    {
      id: "create-issue",
      keys: ["c"],
      run: () => {
        toggleCreateIssueModal(true);
        captureClick({ elementName: WORK_ITEM_TRACKER_ELEMENTS.COMMAND_PALETTE_ADD_BUTTON });
      },
      enabled: () =>
        (hasProjects ? (!projectId && performAnyProjectCreateActions()) || performProjectCreateActions() : false),
      group: "Work item",
      label: "Create new work item",
      shortcut: "C",
      icon: <LayersIcon className="h-3.5 w-3.5" />,
      showInPalette: true,
    },
    {
      id: "create-project",
      keys: ["p"],
      run: () => {
        toggleCreateProjectModal(true);
        captureClick({ elementName: PROJECT_TRACKER_ELEMENTS.COMMAND_PALETTE_SHORTCUT_CREATE_BUTTON });
      },
      enabled: () => !!workspaceSlug && performWorkspaceCreateActions(),
      group: "Project",
      label: "Create new project",
      shortcut: "P",
      icon: <FolderPlus className="h-3.5 w-3.5" />,
      showInPalette: true,
    },
    {
      id: "create-cycle",
      keys: ["q"],
      run: () => {
        toggleCreateCycleModal(true);
        captureClick({ elementName: CYCLE_TRACKER_ELEMENTS.COMMAND_PALETTE_ADD_ITEM });
      },
      enabled: () => !!projectId && performProjectCreateActions(),
      group: "Cycle",
      label: "Create new cycle",
      shortcut: "Q",
      icon: <ContrastIcon className="h-3.5 w-3.5" />,
      showInPalette: true,
    },
    {
      id: "create-module",
      keys: ["m"],
      run: () => {
        toggleCreateModuleModal(true);
        captureClick({ elementName: MODULE_TRACKER_ELEMENTS.COMMAND_PALETTE_ADD_ITEM });
      },
      enabled: () => !!projectId && performProjectCreateActions(),
      group: "Module",
      label: "Create new module",
      shortcut: "M",
      icon: <DiceIcon className="h-3.5 w-3.5" />,
      showInPalette: true,
    },
    {
      id: "create-view",
      keys: ["v"],
      run: () => {
        toggleCreateViewModal(true);
        captureClick({ elementName: PROJECT_VIEW_TRACKER_ELEMENTS.COMMAND_PALETTE_ADD_ITEM });
      },
      enabled: () => !!projectId && performProjectCreateActions(),
      group: "View",
      label: "Create new view",
      shortcut: "V",
      icon: <Layers className="h-3.5 w-3.5" />,
      showInPalette: true,
    },
    {
      id: "create-page",
      keys: ["d"],
      run: () => {
        toggleCreatePageModal({ isOpen: true });
        captureClick({ elementName: PROJECT_PAGE_TRACKER_ELEMENTS.COMMAND_PALETTE_CREATE_BUTTON });
      },
      enabled: () => !!projectId && performProjectCreateActions(),
      group: "Page",
      label: "Create new page",
      shortcut: "D",
      icon: <FileText className="h-3.5 w-3.5" />,
      showInPalette: true,
    },
    {
      id: "bulk-delete-backspace",
      keys: ["backspace"],
      run: () => toggleBulkDeleteIssueModal(true),
      enabled: () => !!projectId && performProjectBulkDeleteActions(),
      showInPalette: false,
    },
    {
      id: "bulk-delete-delete",
      keys: ["delete"],
      run: () => toggleBulkDeleteIssueModal(true),
      enabled: () => !!projectId && performProjectBulkDeleteActions(),
      showInPalette: false,
    },
  ];

  return commands;
};
