import type { ReactNode } from "react";
// plane imports
import { CycleIcon, IntakeIcon, ModuleIcon, PageIcon, ViewsIcon } from "@plane/propel/icons";
import type { IProject } from "@plane/types";

export type TProperties = {
  key: string;
  property: string;
  title: string;
  description: string;
  icon: ReactNode;
  isPro: boolean;
  isEnabled: boolean;
  renderChildren?: (currentProjectDetails: IProject, workspaceSlug: string) => ReactNode;
  href?: string;
};

type TProjectBaseFeatureKeys = "cycles" | "modules" | "views" | "pages" | "inbox";

type TBaseFeatureList = {
  [key in TProjectBaseFeatureKeys]: TProperties;
};

export const PROJECT_BASE_FEATURES_LIST: TBaseFeatureList = {
  cycles: {
    key: "cycles",
    property: "cycle_view",
    title: "Cycles",
    description: "Timebox work as you see fit per project and change frequency from one period to the next.",
    icon: <CycleIcon className="h-5 w-5 flex-shrink-0 rotate-180 text-tertiary" />,
    isPro: false,
    isEnabled: true,
  },
  modules: {
    key: "modules",
    property: "module_view",
    title: "Modules",
    description: "Group work into sub-project-like set-ups with their own leads and assignees.",
    icon: <ModuleIcon width={20} height={20} className="flex-shrink-0 text-tertiary" />,
    isPro: false,
    isEnabled: true,
  },
  views: {
    key: "views",
    property: "issue_views_view",
    title: "Views",
    description: "Save sorts, filters, and display options for later or share them.",
    icon: <ViewsIcon className="h-5 w-5 flex-shrink-0 text-tertiary" />,
    isPro: false,
    isEnabled: true,
  },
  pages: {
    key: "pages",
    property: "page_view",
    title: "Pages",
    description: "Write anything like you write anything.",
    icon: <PageIcon className="h-5 w-5 flex-shrink-0 text-tertiary" />,
    isPro: false,
    isEnabled: true,
  },
  inbox: {
    key: "intake",
    property: "inbox_view",
    title: "Intake",
    description: "Consider and discuss work items before you add them to your project.",
    icon: <IntakeIcon className="h-5 w-5 flex-shrink-0 text-tertiary" />,
    isPro: false,
    isEnabled: true,
  },
};

type TProjectFeatures = {
  project_features: {
    key: string;
    title: string;
    description: string;
    featureList: TBaseFeatureList;
  };
};

export const PROJECT_FEATURES_LIST: TProjectFeatures = {
  project_features: {
    key: "projects_and_issues",
    title: "Projects and work items",
    description: "Toggle these on or off this project.",
    featureList: PROJECT_BASE_FEATURES_LIST,
  },
};
