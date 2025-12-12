import { LayoutGrid } from "lucide-react";
// plane imports
import { CycleIcon, ModuleIcon, PageIcon, ProjectIcon, ViewsIcon } from "@plane/propel/icons";
import type {
  IWorkspaceDefaultSearchResult,
  IWorkspaceIssueSearchResult,
  IWorkspacePageSearchResult,
  IWorkspaceProjectSearchResult,
  IWorkspaceSearchResult,
} from "@plane/types";
import { generateWorkItemLink } from "@plane/utils";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";

export type TCommandGroups = {
  [key: string]: {
    icon: React.ReactNode | null;
    itemName: (item: any) => React.ReactNode;
    path: (item: any, projectId: string | undefined) => string;
    title: string;
  };
};

export const commandGroups: TCommandGroups = {
  cycle: {
    icon: <CycleIcon className="h-3 w-3" />,
    itemName: (cycle: IWorkspaceDefaultSearchResult) => (
      <h6>
        <span className="text-11 text-tertiary">{cycle.project__identifier}</span> {cycle.name}
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
          size="xs"
        />{" "}
        {issue.name}
      </div>
    ),
    path: (issue: IWorkspaceIssueSearchResult) =>
      generateWorkItemLink({
        workspaceSlug: issue?.workspace__slug,
        projectId: issue?.project_id,
        issueId: issue?.id,
        projectIdentifier: issue.project__identifier,
        sequenceId: issue?.sequence_id,
      }),
    title: "Work items",
  },
  issue_view: {
    icon: <ViewsIcon className="h-3 w-3" />,
    itemName: (view: IWorkspaceDefaultSearchResult) => (
      <h6>
        <span className="text-11 text-tertiary">{view.project__identifier}</span> {view.name}
      </h6>
    ),
    path: (view: IWorkspaceDefaultSearchResult) =>
      `/${view?.workspace__slug}/projects/${view?.project_id}/views/${view?.id}`,
    title: "Views",
  },
  module: {
    icon: <ModuleIcon className="h-3 w-3" />,
    itemName: (module: IWorkspaceDefaultSearchResult) => (
      <h6>
        <span className="text-11 text-tertiary">{module.project__identifier}</span> {module.name}
      </h6>
    ),
    path: (module: IWorkspaceDefaultSearchResult) =>
      `/${module?.workspace__slug}/projects/${module?.project_id}/modules/${module?.id}`,
    title: "Modules",
  },
  page: {
    icon: <PageIcon className="h-3 w-3" />,
    itemName: (page: IWorkspacePageSearchResult) => (
      <h6>
        <span className="text-11 text-tertiary">{page.project__identifiers?.[0]}</span> {page.name}
      </h6>
    ),
    path: (page: IWorkspacePageSearchResult, projectId: string | undefined) => {
      let redirectProjectId = page?.project_ids?.[0];
      if (!!projectId && page?.project_ids?.includes(projectId)) redirectProjectId = projectId;
      return redirectProjectId
        ? `/${page?.workspace__slug}/projects/${redirectProjectId}/pages/${page?.id}`
        : `/${page?.workspace__slug}/wiki/${page?.id}`;
    },
    title: "Pages",
  },
  project: {
    icon: <ProjectIcon className="h-3 w-3" />,
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
