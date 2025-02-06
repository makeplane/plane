import { ReactNode } from "react";
import { IProject } from "@plane/types";

export type TProperties = {
  key: string;
  property: string;
  title: string;
  description: string;
  isPro: boolean;
  isEnabled: boolean;
  renderChildren?: (
    currentProjectDetails: IProject,
    isAdmin: boolean,
    handleSubmit: (
      featureKey: string,
      featureProperty: string
    ) => Promise<void>,
    workspaceSlug: string
  ) => ReactNode;
};
export type TFeatureList = {
  [key: string]: TProperties;
};

export type TProjectFeatures = {
  [key: string]: {
    key: string;
    title: string;
    description: string;
    featureList: TFeatureList;
  };
};

export const PROJECT_FEATURES_LIST: TProjectFeatures = {
  project_features: {
    key: "projects_and_issues",
    title: "Projects and work items",
    description: "Toggle these on or off this project.",
    featureList: {
      cycles: {
        key: "cycles",
        property: "cycle_view",
        title: "Cycles",
        description:
          "Timebox work as you see fit per project and change frequency from one period to the next.",
        isPro: false,
        isEnabled: true,
      },
      modules: {
        key: "modules",
        property: "module_view",
        title: "Modules",
        description:
          "Group work into sub-project-like set-ups with their own leads and assignees.",
        isPro: false,
        isEnabled: true,
      },
      views: {
        key: "views",
        property: "issue_views_view",
        title: "Views",
        description:
          "Save sorts, filters, and display options for later or share them.",
        isPro: false,
        isEnabled: true,
      },
      pages: {
        key: "pages",
        property: "page_view",
        title: "Pages",
        description: "Write anything like you write anything.",
        isPro: false,
        isEnabled: true,
      },
      inbox: {
        key: "intake",
        property: "inbox_view",
        title: "Intake",
        description:
          "Consider and discuss work items before you add them to your project.",
        isPro: false,
        isEnabled: true,
      },
    },
  },
  project_others: {
    key: "work_management",
    title: "Work management",
    description:
      "Available only on some plans as indicated by the label next to the feature below.",
    featureList: {
      is_time_tracking_enabled: {
        key: "time_tracking",
        property: "is_time_tracking_enabled",
        title: "Time Tracking",
        description:
          "Log time, see timesheets, and download full CSVs for your entire workspace.",
        isPro: true,
        isEnabled: false,
      },
    },
  },
};
