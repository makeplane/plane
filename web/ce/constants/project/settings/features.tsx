import { ReactNode } from "react";
import { FileText, Inbox, Timer } from "lucide-react";
import { ContrastIcon, DiceIcon, PhotoFilterIcon } from "@plane/ui";
// components

type TFeatureList = {
  [key: string]: {
    property: string;
    title: string;
    description: string;
    icon: ReactNode;
    isEnabled: boolean; // feature is enabled or not
  };
};

type ProjectFeatures = {
  [key: string]: {
    title: string;
    featureList: TFeatureList;
  };
};

export const PROJECT_FEATURES_LIST: ProjectFeatures = {
  project_features: {
    title: "Features",
    featureList: {
      cycles: {
        property: "cycle_view",
        title: "Cycles",
        description: "Time-box issues and boost momentum, similar to sprints in scrum.",
        icon: <ContrastIcon className="h-4 w-4 flex-shrink-0 rotate-180 text-purple-500" />,
        isEnabled: true,
      },
      modules: {
        property: "module_view",
        title: "Modules",
        description: "Group multiple issues together and track the progress.",
        icon: <DiceIcon width={16} height={16} className="flex-shrink-0 text-red-500" />,
        isEnabled: true,
      },
      views: {
        property: "issue_views_view",
        title: "Views",
        description: "Apply filters to issues and save them to analyse and investigate work.",
        icon: <PhotoFilterIcon className="h-4 w-4 flex-shrink-0 text-cyan-500" />,
        isEnabled: true,
      },
      pages: {
        property: "page_view",
        title: "Pages",
        description: "Document ideas, feature requirements, discussions within your project.",
        icon: <FileText className="h-4 w-4 flex-shrink-0 text-red-400" />,
        isEnabled: true,
      },
      inbox: {
        property: "inbox_view",
        title: "Inbox",
        description: "Capture external inputs, move valid issues to workflow.",
        icon: <Inbox className="h-4 w-4 flex-shrink-0 text-fuchsia-500" />,
        isEnabled: true,
      },
    },
  },
  project_others: {
    title: "Others",
    featureList: {
      time_tracking: {
        property: "time_tracking",
        title: "Time Tracking",
        description: "Keep the work logs of the users in track ",
        icon: <Timer className="h-4 w-4 flex-shrink-0 text-gray-300" />,
        isEnabled: false,
      },
    },
  },
};
