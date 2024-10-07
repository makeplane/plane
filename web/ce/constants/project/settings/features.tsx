import { ReactNode } from "react";
import { FileText, Layers, Timer } from "lucide-react";
import { ContrastIcon, DiceIcon, Intake } from "@plane/ui";

export type TFeatureList = {
  [key: string]: {
    property: string;
    title: string;
    description: string;
    icon: ReactNode;
    isPro: boolean;
    isEnabled: boolean;
  };
};

export type TProjectFeatures = {
  [key: string]: {
    title: string;
    description: string;
    featureList: TFeatureList;
  };
};

export const PROJECT_FEATURES_LIST: TProjectFeatures = {
  project_features: {
    title: "Projects and issues",
    description: "Toggle these on or off this project.",
    featureList: {
      cycles: {
        property: "cycle_view",
        title: "Cycles",
        description: "Timebox work as you see fit per project and change frequency from one period to the next.",
        icon: <ContrastIcon className="h-5 w-5 flex-shrink-0 rotate-180 text-custom-text-300" />,
        isPro: false,
        isEnabled: true,
      },
      modules: {
        property: "module_view",
        title: "Modules",
        description: "Group work into sub-project-like set-ups with their own leads and assignees.",
        icon: <DiceIcon width={20} height={20} className="flex-shrink-0 text-custom-text-300" />,
        isPro: false,
        isEnabled: true,
      },
      views: {
        property: "issue_views_view",
        title: "Views",
        description: "Save sorts, filters, and display options for later or share them.",
        icon: <Layers className="h-5 w-5 flex-shrink-0 text-custom-text-300" />,
        isPro: false,
        isEnabled: true,
      },
      pages: {
        property: "page_view",
        title: "Pages",
        description: "Write anything like you write anything.",
        icon: <FileText className="h-5 w-5 flex-shrink-0 text-custom-text-300" />,
        isPro: false,
        isEnabled: true,
      },
      inbox: {
        property: "inbox_view",
        title: "Intake",
        description: "Consider and discuss issues before you add them to your project.",
        icon: <Intake className="h-5 w-5 flex-shrink-0 text-custom-text-300" />,
        isPro: false,
        isEnabled: true,
      },
    },
  },
  project_others: {
    title: "Work management",
    description: "Available only on some plans as indicated by the label next to the feature below.",
    featureList: {
      is_time_tracking_enabled: {
        property: "is_time_tracking_enabled",
        title: "Time Tracking",
        description: "Log time, see timesheets, and download full CSVs for your entire workspace.",
        icon: <Timer className="h-5 w-5 flex-shrink-0 text-custom-text-300" />,
        isPro: true,
        isEnabled: false,
      },
    },
  },
};
