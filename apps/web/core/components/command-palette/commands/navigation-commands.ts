"use client";

import { Search } from "lucide-react";
import { CommandConfig } from "../types";

export const createNavigationCommands = (
  openProjectList: () => void,
  openCycleList: () => void,
  openIssueList: () => void
): CommandConfig[] => [
  {
    id: "open-project-list",
    type: "navigation",
    group: "navigate",
    title: "Open project",
    description: "Search and navigate to a project",
    icon: Search,
    keySequence: "op",
    isEnabled: () => true,
    isVisible: () => true,
    action: openProjectList,
  },
  {
    id: "open-cycle-list",
    type: "navigation",
    group: "navigate",
    title: "Open cycle",
    description: "Search and navigate to a cycle",
    icon: Search,
    keySequence: "oc",
    isEnabled: () => true,
    isVisible: () => true,
    action: openCycleList,
  },
  {
    id: "open-issue-list",
    type: "navigation",
    group: "navigate",
    title: "Open recent work items",
    description: "Search and navigate to recent work items",
    icon: Search,
    keySequence: "oi",
    isEnabled: () => true,
    isVisible: () => true,
    action: openIssueList,
  },
];
