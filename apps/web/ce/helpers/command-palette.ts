// types
import {
  CYCLE_TRACKER_ELEMENTS,
  MODULE_TRACKER_ELEMENTS,
  PROJECT_PAGE_TRACKER_ELEMENTS,
  PROJECT_TRACKER_ELEMENTS,
  PROJECT_VIEW_TRACKER_ELEMENTS,
  WORK_ITEM_TRACKER_ELEMENTS,
} from "@plane/constants";
import { TCommandPaletteActionList, TCommandPaletteShortcut, TCommandPaletteShortcutList } from "@plane/types";
// store
import { captureClick } from "@/helpers/event-tracker.helper";
import { store } from "@/lib/store-context";

export const getGlobalShortcutsList: () => TCommandPaletteActionList = () => {
  const { toggleCreateIssueModal } = store.commandPalette;

  return {
    c: {
      title: "Create a new work item",
      description: "Create a new work item in the current project",
      action: () => {
        toggleCreateIssueModal(true);
        captureClick({ elementName: WORK_ITEM_TRACKER_ELEMENTS.COMMAND_PALETTE_ADD_BUTTON });
      },
    },
  };
};

export const getWorkspaceShortcutsList: () => TCommandPaletteActionList = () => {
  const { toggleCreateProjectModal } = store.commandPalette;

  return {
    p: {
      title: "Create a new project",
      description: "Create a new project in the current workspace",
      action: () => {
        toggleCreateProjectModal(true);
        captureClick({ elementName: PROJECT_TRACKER_ELEMENTS.COMMAND_PALETTE_SHORTCUT_CREATE_BUTTON });
      },
    },
  };
};

export const getProjectShortcutsList: () => TCommandPaletteActionList = () => {
  const {
    toggleCreatePageModal,
    toggleCreateModuleModal,
    toggleCreateCycleModal,
    toggleCreateViewModal,
    toggleBulkDeleteIssueModal,
  } = store.commandPalette;

  return {
    d: {
      title: "Create a new page",
      description: "Create a new page in the current project",
      action: () => {
        toggleCreatePageModal({ isOpen: true });
        captureClick({ elementName: PROJECT_PAGE_TRACKER_ELEMENTS.COMMAND_PALETTE_SHORTCUT_CREATE_BUTTON });
      },
    },
    m: {
      title: "Create a new module",
      description: "Create a new module in the current project",
      action: () => {
        toggleCreateModuleModal(true);
        captureClick({ elementName: MODULE_TRACKER_ELEMENTS.COMMAND_PALETTE_ADD_ITEM });
      },
    },
    q: {
      title: "Create a new cycle",
      description: "Create a new cycle in the current project",
      action: () => {
        toggleCreateCycleModal(true);
        captureClick({ elementName: CYCLE_TRACKER_ELEMENTS.COMMAND_PALETTE_ADD_ITEM });
      },
    },
    v: {
      title: "Create a new view",
      description: "Create a new view in the current project",
      action: () => {
        toggleCreateViewModal(true);
        captureClick({ elementName: PROJECT_VIEW_TRACKER_ELEMENTS.COMMAND_PALETTE_ADD_ITEM });
      },
    },
    backspace: {
      title: "Bulk delete work items",
      description: "Bulk delete work items in the current project",
      action: () => toggleBulkDeleteIssueModal(true),
    },
    delete: {
      title: "Bulk delete work items",
      description: "Bulk delete work items in the current project",
      action: () => toggleBulkDeleteIssueModal(true),
    },
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handleAdditionalKeyDownEvents = (e: KeyboardEvent) => null;

export const getNavigationShortcutsList = (): TCommandPaletteShortcut[] => [
  { keys: "Ctrl,K", description: "Open command menu" },
];

export const getCommonShortcutsList = (platform: string): TCommandPaletteShortcut[] => [
  { keys: "P", description: "Create project" },
  { keys: "C", description: "Create work item" },
  { keys: "Q", description: "Create cycle" },
  { keys: "M", description: "Create module" },
  { keys: "V", description: "Create view" },
  { keys: "D", description: "Create page" },
  { keys: "Delete", description: "Bulk delete work items" },
  { keys: "Shift,/", description: "Open shortcuts guide" },
  {
    keys: platform === "MacOS" ? "Ctrl,control,C" : "Ctrl,Alt,C",
    description: "Copy work item URL from the work item details page",
  },
];

export const getAdditionalShortcutsList = (): TCommandPaletteShortcutList[] => [];
