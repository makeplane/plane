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
    featureList: TFeatureList;
  };
};

export const PROJECT_FEATURES_LIST: TProjectFeatures = {
  project_features: {
    title: "Features",
    featureList: {
      cycles: {
        property: "cycle_view",
        title: "Cycles",
        description: "Time-box issues and boost momentum, similar to sprints in scrum.",
        icon: <ContrastIcon className="h-5 w-5 flex-shrink-0 rotate-180 text-custom-text-300" />,
        isPro: false,
        isEnabled: true,
      },
      modules: {
        property: "module_view",
        title: "Modules",
        description: "Group multiple issues together and track the progress.",
        icon: <DiceIcon width={20} height={20} className="flex-shrink-0 text-custom-text-300" />,
        isPro: false,
        isEnabled: true,
      },
      views: {
        property: "issue_views_view",
        title: "Views",
        description: "Apply filters to issues and save them to analyse and investigate work.",
        icon: <Layers className="h-5 w-5 flex-shrink-0 text-custom-text-300" />,
        isPro: false,
        isEnabled: true,
      },
      pages: {
        property: "page_view",
        title: "Pages",
        description: "Document ideas, feature requirements, discussions within your project.",
        icon: <FileText className="h-5 w-5 flex-shrink-0 text-custom-text-300" />,
        isPro: false,
        isEnabled: true,
      },
      inbox: {
        property: "inbox_view",
        title: "Intake",
        description: "Capture external inputs, move valid issues to workflow.",
        icon: <Intake className="h-5 w-5 flex-shrink-0 text-custom-text-300" />,
        isPro: false,
        isEnabled: true,
      },
    },
  },
  project_others: {
    title: "Others",
    featureList: {
      is_time_tracking_enabled: {
        property: "is_time_tracking_enabled",
        title: "Time Tracking",
        description: "Keep the work logs of the users in track ",
        icon: <Timer className="h-5 w-5 flex-shrink-0 text-custom-text-300" />,
        isPro: true,
        isEnabled: false,
      },
    },
  },
};
