import { ReactNode } from "react";
import { FileText, Layers, Timer } from "lucide-react";
// plane imports
import { IProject } from "@plane/types";
import { ContrastIcon, DiceIcon, Intake } from "@plane/ui";

export type TProperties = {
  key: string;
  property: string;
  title: string;
  description: string;
  icon: ReactNode;
  isPro: boolean;
  isEnabled: boolean;
  renderChildren?: (currentProjectDetails: IProject, workspaceSlug: string) => ReactNode;
};

type TProjectBaseFeatureKeys = "cycles" | "modules" | "views" | "pages" | "inbox";
type TProjectOtherFeatureKeys = "is_time_tracking_enabled";

type TBaseFeatureList = {
  [key in TProjectBaseFeatureKeys]: TProperties;
};

export const PROJECT_BASE_FEATURES_LIST: TBaseFeatureList = {
  cycles: {
    key: "cycles",
    property: "cycle_view",
    title: "Cycles",
    description: "Timebox work as you see fit per project and change frequency from one period to the next.",
    icon: <ContrastIcon className="h-5 w-5 flex-shrink-0 rotate-180 text-custom-text-300" />,
    isPro: false,
    isEnabled: true,
  },
  modules: {
    key: "modules",
    property: "module_view",
    title: "Modules",
    description: "Group work into sub-project-like set-ups with their own leads and assignees.",
    icon: <DiceIcon width={20} height={20} className="flex-shrink-0 text-custom-text-300" />,
    isPro: false,
    isEnabled: true,
  },
  views: {
    key: "views",
    property: "issue_views_view",
    title: "Views",
    description: "Save sorts, filters, and display options for later or share them.",
    icon: <Layers className="h-5 w-5 flex-shrink-0 text-custom-text-300" />,
    isPro: false,
    isEnabled: true,
  },
  pages: {
    key: "pages",
    property: "page_view",
    title: "Pages",
    description: "Write anything like you write anything.",
    icon: <FileText className="h-5 w-5 flex-shrink-0 text-custom-text-300" />,
    isPro: false,
    isEnabled: true,
  },
  inbox: {
    key: "intake",
    property: "inbox_view",
    title: "Intake",
    description: "Consider and discuss work items before you add them to your project.",
    icon: <Intake className="h-5 w-5 flex-shrink-0 text-custom-text-300" />,
    isPro: false,
    isEnabled: true,
  },
};

type TOtherFeatureList = {
  [key in TProjectOtherFeatureKeys]: TProperties;
};

export const PROJECT_OTHER_FEATURES_LIST: TOtherFeatureList = {
  is_time_tracking_enabled: {
    key: "time_tracking",
    property: "is_time_tracking_enabled",
    title: "Time Tracking",
    description: "Log time, see timesheets, and download full CSVs for your entire workspace.",
    icon: <Timer className="h-5 w-5 flex-shrink-0 text-custom-text-300" />,
    isPro: true,
    isEnabled: false,
  },
};

type TProjectFeatures = {
  project_features: {
    key: string;
    title: string;
    description: string;
    featureList: TBaseFeatureList;
  };
  project_others: {
    key: string;
    title: string;
    description: string;
    featureList: TOtherFeatureList;
  };
};

export const PROJECT_FEATURES_LIST: TProjectFeatures = {
  project_features: {
    key: "projects_and_issues",
    title: "Projects and work items",
    description: "Toggle these on or off this project.",
    featureList: PROJECT_BASE_FEATURES_LIST,
  },
  project_others: {
    key: "work_management",
    title: "Work management",
    description: "Available only on some plans as indicated by the label next to the feature below.",
    featureList: PROJECT_OTHER_FEATURES_LIST,
  },
};
