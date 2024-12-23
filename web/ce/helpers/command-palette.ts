// types
import { TCommandPaletteActionList, TCommandPaletteShortcut, TCommandPaletteShortcutList } from "@plane/types";
// store
import { store } from "@/lib/store-context";

export const getGlobalShortcutsList: () => TCommandPaletteActionList = () => {
  const { toggleCreateIssueModal } = store.commandPalette;

  return {
    c: {
      title: "Create a new issue",
      description: "Create a new issue in the current project",
      action: () => toggleCreateIssueModal(true),
    },
  };
};

export const getWorkspaceShortcutsList: () => TCommandPaletteActionList = () => {
  const { toggleCreateProjectModal } = store.commandPalette;

  return {
    p: {
      title: "Create a new project",
      description: "Create a new project in the current workspace",
      action: () => toggleCreateProjectModal(true),
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
      action: () => toggleCreatePageModal({ isOpen: true }),
    },
    m: {
      title: "Create a new module",
      description: "Create a new module in the current project",
      action: () => toggleCreateModuleModal(true),
    },
    q: {
      title: "Create a new cycle",
      description: "Create a new cycle in the current project",
      action: () => toggleCreateCycleModal(true),
    },
    v: {
      title: "Create a new view",
      description: "Create a new view in the current project",
      action: () => toggleCreateViewModal(true),
    },
    backspace: {
      title: "Bulk delete issues",
      description: "Bulk delete issues in the current project",
      action: () => toggleBulkDeleteIssueModal(true),
    },
    delete: {
      title: "Bulk delete issues",
      description: "Bulk delete issues in the current project",
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
  { keys: "C", description: "Create issue" },
  { keys: "Q", description: "Create cycle" },
  { keys: "M", description: "Create module" },
  { keys: "V", description: "Create view" },
  { keys: "D", description: "Create page" },
  { keys: "Delete", description: "Bulk delete issues" },
  { keys: "Shift,/", description: "Open shortcuts guide" },
  {
    keys: platform === "MacOS" ? "Ctrl,control,C" : "Ctrl,Alt,C",
    description: "Copy issue URL from the issue details page",
  },
];

export const getAdditionalShortcutsList = (): TCommandPaletteShortcutList[] => [];
