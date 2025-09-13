import React from "react";
import { FolderPlus, Settings } from "lucide-react";
import { LayersIcon } from "@plane/propel/icons";
import {
  PROJECT_TRACKER_ELEMENTS,
  WORK_ITEM_TRACKER_ELEMENTS,
} from "@plane/constants";
import { captureClick } from "@/helpers/event-tracker.helper";
import { PaletteCommandGroup } from "./types";

interface BuildParams {
  workspaceSlug?: string | string[];
  pages: string[];
  workspaceProjectIds?: string[];
  canPerformAnyCreateAction: boolean;
  canPerformWorkspaceActions: boolean;
  closePalette: () => void;
  toggleCreateIssueModal: (v: boolean) => void;
  toggleCreateProjectModal: (v: boolean) => void;
  setPages: React.Dispatch<React.SetStateAction<string[]>>;
  setPlaceholder: (v: string) => void;
  setSearchTerm: (v: string) => void;
  createNewWorkspace: () => void;
}

export const buildCommandGroups = (params: BuildParams): PaletteCommandGroup[] => {
  const {
    workspaceSlug,
    pages,
    workspaceProjectIds,
    canPerformAnyCreateAction,
    canPerformWorkspaceActions,
    closePalette,
    toggleCreateIssueModal,
    toggleCreateProjectModal,
    setPages,
    setPlaceholder,
    setSearchTerm,
    createNewWorkspace,
  } = params;

  const groups: PaletteCommandGroup[] = [];

  if (
    workspaceSlug &&
    workspaceProjectIds &&
    workspaceProjectIds.length > 0 &&
    canPerformAnyCreateAction
  ) {
    groups.push({
      id: "work-item",
      heading: "Work item",
      commands: [
        {
          id: "create-work-item",
          label: "Create new work item",
          shortcut: "C",
          icon: LayersIcon,
          perform: () => {
            closePalette();
            captureClick({ elementName: WORK_ITEM_TRACKER_ELEMENTS.COMMAND_PALETTE_ADD_BUTTON });
            toggleCreateIssueModal(true);
          },
          enabled: true,
        },
      ],
    });
  }

  if (workspaceSlug && canPerformWorkspaceActions) {
    groups.push({
      id: "project",
      heading: "Project",
      commands: [
        {
          id: "create-project",
          label: "Create new project",
          shortcut: "P",
          icon: FolderPlus,
          perform: () => {
            closePalette();
            captureClick({ elementName: PROJECT_TRACKER_ELEMENTS.COMMAND_PALETTE_CREATE_BUTTON });
            toggleCreateProjectModal(true);
          },
          enabled: true,
        },
      ],
    });
  }

  groups.push({
    id: "workspace-settings",
    heading: "Workspace Settings",
    commands: [
      {
        id: "search-settings",
        label: "Search settings...",
        icon: Settings,
        perform: () => {
          setPlaceholder("Search workspace settings...");
          setSearchTerm("");
          setPages((p) => [...p, "settings"]);
        },
        enabled: !!(canPerformWorkspaceActions && workspaceSlug),
      },
    ],
  });

  groups.push({
    id: "account",
    heading: "Account",
    commands: [
      {
        id: "create-workspace",
        label: "Create new workspace",
        icon: FolderPlus,
        perform: createNewWorkspace,
        enabled: true,
      },
      {
        id: "change-interface-theme",
        label: "Change interface theme...",
        icon: Settings,
        perform: () => {
          setPlaceholder("Change interface theme...");
          setSearchTerm("");
          setPages((p) => [...p, "change-interface-theme"]);
        },
        enabled: true,
      },
    ],
  });

  return groups;
};
