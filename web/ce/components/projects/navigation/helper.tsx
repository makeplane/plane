import { FileText, Layers } from "lucide-react";
import { EUserPermissions } from "@plane/constants";
import { ContrastIcon, DiceIcon, Intake, LayersIcon } from "@plane/ui";
import { TNavigationItem } from "@/components/workspace";

export const getProjectFeatureNavigation = (
  workspaceSlug: string,
  projectId: string,
  project: {
    cycle_view: boolean;
    module_view: boolean;
    issue_views_view: boolean;
    page_view: boolean;
    inbox_view: boolean;
  }
): TNavigationItem[] => [
  {
    i18n_key: "sidebar.work_items",
    key: "work_items",
    name: "Work items",
    href: `/${workspaceSlug}/projects/${projectId}/issues`,
    icon: LayersIcon,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    shouldRender: true,
    sortOrder: 1,
  },
  {
    i18n_key: "sidebar.cycles",
    key: "cycles",
    name: "Cycles",
    href: `/${workspaceSlug}/projects/${projectId}/cycles`,
    icon: ContrastIcon,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    shouldRender: project.cycle_view,
    sortOrder: 2,
  },
  {
    i18n_key: "sidebar.modules",
    key: "modules",
    name: "Modules",
    href: `/${workspaceSlug}/projects/${projectId}/modules`,
    icon: DiceIcon,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    shouldRender: project.module_view,
    sortOrder: 3,
  },
  {
    i18n_key: "sidebar.views",
    key: "views",
    name: "Views",
    href: `/${workspaceSlug}/projects/${projectId}/views`,
    icon: Layers,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    shouldRender: project.issue_views_view,
    sortOrder: 4,
  },
  {
    i18n_key: "sidebar.pages",
    key: "pages",
    name: "Pages",
    href: `/${workspaceSlug}/projects/${projectId}/pages`,
    icon: FileText,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    shouldRender: project.page_view,
    sortOrder: 5,
  },
  {
    i18n_key: "sidebar.intake",
    key: "intake",
    name: "Intake",
    href: `/${workspaceSlug}/projects/${projectId}/intake`,
    icon: Intake,
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    shouldRender: project.inbox_view,
    sortOrder: 6,
  },
];
