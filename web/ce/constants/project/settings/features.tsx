import { ReactNode } from "react";
import { FileText, Layers, ListTodo, Mail, Timer, Zap } from "lucide-react";
import { ContrastIcon, DiceIcon, Intake } from "@plane/ui";
import IntakeSubFeatures from "../../../../core/components/project/settings/intake-sub-features";
import { IProject } from "@plane/types";
export type TProperties = {
  property: string;
  title: string;
  description: string;
  icon: ReactNode;
  isPro: boolean;
  isEnabled: boolean;
  renderChildren?: (
    currentProjectDetails: IProject,
    isAdmin: boolean,
    handleSubmit: (featureKey: string, featureProperty: string) => Promise<void>
  ) => ReactNode;
};
export type TFeatureList = {
  [key: string]: TProperties;
};
export type TIntakeFeatureList = {
  [key: string]: TProperties & {
    hasOptions: boolean;
    hasHyperlink?: boolean;
    canShuffle?: boolean;
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
        renderChildren: (currentProjectDetails, isAdmin, handleSubmit) => (
          <IntakeSubFeatures projectDetails={currentProjectDetails} isAdmin={isAdmin} handleSubmit={handleSubmit} />
        ),
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

export const INTAKE_FEATURES_LIST: TIntakeFeatureList = {
  "in-app": {
    property: "in_app",
    title: "In-app",
    description: "Let the Plane app users in your org add issues via intake",
    icon: <Zap className="h-4 w-4 flex-shrink-0 text-custom-text-300" />,
    isPro: false,
    isEnabled: true,
    hasOptions: false,
  },
  email: {
    property: "email",
    title: "Email",
    description: "You can send or forward emails to this address to create tasks and attach the email to them",
    icon: <Mail className="h-4 w-4 flex-shrink-0 text-custom-text-300" />,
    isPro: false,
    isEnabled: true,
    hasOptions: true,
    hasHyperlink: false,
    canShuffle: true,
  },
  forms: {
    property: "forms",
    title: "Forms",
    description: "You can share this link to get tasks created directly from the Web",
    icon: <ListTodo className="h-4 w-4 flex-shrink-0 text-custom-text-300" />,
    isPro: false,
    isEnabled: true,
    hasOptions: true,
    hasHyperlink: true,
    canShuffle: true,
  },
};
