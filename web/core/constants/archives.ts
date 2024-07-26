"use client";

// types
import { IProject } from "@plane/types";
// icons
import { ContrastIcon, DiceIcon, LayersIcon } from "@plane/ui";

export const ARCHIVES_TAB_LIST: {
  key: string;
  label: string;
  shouldRender: (projectDetails: IProject) => boolean;
}[] = [
  {
    key: "issues",
    label: "Issues",
    shouldRender: () => true,
  },
  {
    key: "cycles",
    label: "Cycles",
    shouldRender: (projectDetails) => projectDetails.cycle_view,
  },
  {
    key: "modules",
    label: "Modules",
    shouldRender: (projectDetails) => projectDetails.module_view,
  },
];

export const PROJECT_ARCHIVES_BREADCRUMB_LIST: {
  [key: string]: {
    label: string;
    href: string;
    icon: React.FC<React.SVGAttributes<SVGElement> & { className?: string }>;
  };
} = {
  issues: {
    label: "Issues",
    href: "/issues",
    icon: LayersIcon,
  },
  cycles: {
    label: "Cycles",
    href: "/cycles",
    icon: ContrastIcon,
  },
  modules: {
    label: "Modules",
    href: "/modules",
    icon: DiceIcon,
  },
};
