"use client";

// types
import { Briefcase, FileText, Layers, LayoutGrid } from "lucide-react";
import {
  IWorkspaceDefaultSearchResult,
  IWorkspaceIssueSearchResult,
  IWorkspacePageSearchResult,
  IWorkspaceProjectSearchResult,
  IWorkspaceSearchResult,
} from "@plane/types";
// ui
import { ContrastIcon, DiceIcon } from "@plane/ui";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues";

export const commandGroups: {
  [key: string]: {
    icon: JSX.Element | null;
    itemName: (item: any) => React.ReactNode;
    path: (item: any, projectId: string | undefined) => string;
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
    icon: null,
    itemName: (issue: IWorkspaceIssueSearchResult) => (
      <div className="flex gap-2">
        <IssueIdentifier
          projectId={issue.project_id}
          issueTypeId={issue.type_id}
          projectIdentifier={issue.project__identifier}
          issueSequenceId={issue.sequence_id}
          textContainerClassName="text-xs"
        />{" "}
        {issue.name}
      </div>
    ),
    path: (issue: IWorkspaceIssueSearchResult) =>
      `/${issue?.workspace__slug}/projects/${issue?.project_id}/issues/${issue?.id}`,
    title: "Issues",
  },
  issue_view: {
    icon: <Layers className="h-3 w-3" />,
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
    itemName: (page: IWorkspacePageSearchResult) => (
      <h6>
        <span className="text-xs text-custom-text-300">{page.project__identifiers?.[0]}</span> {page.name}
      </h6>
    ),
    path: (page: IWorkspacePageSearchResult, projectId: string | undefined) => {
      let redirectProjectId = page?.project_ids?.[0];
      if (!!projectId && page?.project_ids?.includes(projectId)) redirectProjectId = projectId;
      return `/${page?.workspace__slug}/projects/${redirectProjectId}/pages/${page?.id}`;
    },
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
