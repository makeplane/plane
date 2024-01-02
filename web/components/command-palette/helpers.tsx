// types
import { ContrastIcon, DiceIcon, LayersIcon, PhotoFilterIcon } from "@plane/ui";
import { Briefcase, FileText, LayoutGrid } from "lucide-react";
import {
  IWorkspaceDefaultSearchResult,
  IWorkspaceIssueSearchResult,
  IWorkspaceProjectSearchResult,
  IWorkspaceSearchResult,
} from "@plane/types";

export const commandGroups: {
  [key: string]: {
    icon: JSX.Element;
    itemName: (item: any) => React.ReactNode;
    path: (item: any) => string;
    title: string;
  };
} = {
  cycle: {
    icon: <ContrastIcon className="h-3 w-3" />,
    itemName: (cycle: IWorkspaceDefaultSearchResult) => (
      <h6>
        <span className="text-xs text-custom-text-300">{cycle.project__identifier}</span> {cycle.name}
      </h6>
    ),
    path: (cycle: IWorkspaceDefaultSearchResult) =>
      `/${cycle?.workspace__slug}/projects/${cycle?.project_id}/cycles/${cycle?.id}`,
    title: "Cycles",
  },
  issue: {
    icon: <LayersIcon className="h-3 w-3" />,
    itemName: (issue: IWorkspaceIssueSearchResult) => (
      <h6>
        <span className="text-xs text-custom-text-300">
          {issue.project__identifier}-{issue.sequence_id}
        </span>{" "}
        {issue.name}
      </h6>
    ),
    path: (issue: IWorkspaceIssueSearchResult) =>
      `/${issue?.workspace__slug}/projects/${issue?.project_id}/issues/${issue?.id}`,
    title: "Issues",
  },
  issue_view: {
    icon: <PhotoFilterIcon className="h-3 w-3" />,
    itemName: (view: IWorkspaceDefaultSearchResult) => (
      <h6>
        <span className="text-xs text-custom-text-300">{view.project__identifier}</span> {view.name}
      </h6>
    ),
    path: (view: IWorkspaceDefaultSearchResult) =>
      `/${view?.workspace__slug}/projects/${view?.project_id}/views/${view?.id}`,
    title: "Views",
  },
  module: {
    icon: <DiceIcon className="h-3 w-3" />,
    itemName: (module: IWorkspaceDefaultSearchResult) => (
      <h6>
        <span className="text-xs text-custom-text-300">{module.project__identifier}</span> {module.name}
      </h6>
    ),
    path: (module: IWorkspaceDefaultSearchResult) =>
      `/${module?.workspace__slug}/projects/${module?.project_id}/modules/${module?.id}`,
    title: "Modules",
  },
  page: {
    icon: <FileText className="h-3 w-3" />,
    itemName: (page: IWorkspaceDefaultSearchResult) => (
      <h6>
        <span className="text-xs text-custom-text-300">{page.project__identifier}</span> {page.name}
      </h6>
    ),
    path: (page: IWorkspaceDefaultSearchResult) =>
      `/${page?.workspace__slug}/projects/${page?.project_id}/pages/${page?.id}`,
    title: "Pages",
  },
  project: {
    icon: <Briefcase className="h-3 w-3" />,
    itemName: (project: IWorkspaceProjectSearchResult) => project?.name,
    path: (project: IWorkspaceProjectSearchResult) => `/${project?.workspace__slug}/projects/${project?.id}/issues/`,
    title: "Projects",
  },
  workspace: {
    icon: <LayoutGrid className="h-3 w-3" />,
    itemName: (workspace: IWorkspaceSearchResult) => workspace?.name,
    path: (workspace: IWorkspaceSearchResult) => `/${workspace?.slug}/`,
    title: "Workspaces",
  },
};
