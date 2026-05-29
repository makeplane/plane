import { Briefcase, FileText, Layers, LayoutGrid } from "lucide-react";
// plane imports
import { ContrastIcon, DiceIcon } from "@plane/propel/icons";
import type {
  IWorkspaceDefaultSearchResult,
  IWorkspaceIssueSearchResult,
  IWorkspacePageSearchResult,
  IWorkspaceProjectSearchResult,
  IWorkspaceSearchResult,
} from "@plane/types";
import { generateWorkItemLink } from "@plane/utils";
// components
import type { TPowerKSearchResultsKeys } from "@/components/power-k/core/types";
// plane web imports
import { SEARCH_RESULTS_GROUPS_MAP_EXTENDED } from "@/plane-web/components/command-palette/power-k/search/search-results-map";
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";

export type TPowerKSearchResultGroupDetails = {
  icon?: React.ComponentType<{ className?: string }>;
  itemName: (item: any) => React.ReactNode;
  path: (item: any, projectId: string | undefined) => string;
  title: string;
};

export const POWER_K_SEARCH_RESULTS_GROUPS_MAP: Record<TPowerKSearchResultsKeys, TPowerKSearchResultGroupDetails> = {
  cycle: {
    icon: ContrastIcon,
    itemName: (cycle: IWorkspaceDefaultSearchResult) => (
      <p>
        <span className="text-11 text-tertiary">{cycle.project__identifier}</span> {cycle.name}
      </p>
    ),
    path: (cycle: IWorkspaceDefaultSearchResult) =>
      `/${cycle?.workspace__slug}/projects/${cycle?.project_id}/cycles/${cycle?.id}`,
    title: "Cycles",
  },
  issue: {
    itemName: (workItem: IWorkspaceIssueSearchResult) => (
      <div className="flex gap-2">
        <IssueIdentifier
          projectId={workItem.project_id}
          issueTypeId={workItem.type_id}
          projectIdentifier={workItem.project__identifier}
          issueSequenceId={workItem.sequence_id}
          size="xs"
        />{" "}
        {workItem.name}
      </div>
    ),
    path: (workItem: IWorkspaceIssueSearchResult) =>
      generateWorkItemLink({
        workspaceSlug: workItem?.workspace__slug,
        projectId: workItem?.project_id,
        issueId: workItem?.id,
        projectIdentifier: workItem.project__identifier,
        sequenceId: workItem?.sequence_id,
      }),
    title: "Work items",
  },
  issue_view: {
    icon: Layers,
    itemName: (view: IWorkspaceDefaultSearchResult) => (
      <p>
        <span className="text-11 text-tertiary">{view.project__identifier}</span> {view.name}
      </p>
    ),
    path: (view: IWorkspaceDefaultSearchResult) =>
      `/${view?.workspace__slug}/projects/${view?.project_id}/views/${view?.id}`,
    title: "Views",
  },
  module: {
    icon: DiceIcon,
    itemName: (module: IWorkspaceDefaultSearchResult) => (
      <p>
        <span className="text-11 text-tertiary">{module.project__identifier}</span> {module.name}
      </p>
    ),
    path: (module: IWorkspaceDefaultSearchResult) =>
      `/${module?.workspace__slug}/projects/${module?.project_id}/modules/${module?.id}`,
    title: "Modules",
  },
  page: {
    icon: FileText,
    itemName: (page: IWorkspacePageSearchResult) => (
      <p>
        <span className="text-11 text-tertiary">{page.project__identifiers?.[0]}</span> {page.name}
      </p>
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
    icon: Briefcase,
    itemName: (project: IWorkspaceProjectSearchResult) => project?.name,
    path: (project: IWorkspaceProjectSearchResult) => `/${project?.workspace__slug}/projects/${project?.id}/issues/`,
    title: "Projects",
  },
  workspace: {
    icon: LayoutGrid,
    itemName: (workspace: IWorkspaceSearchResult) => workspace?.name,
    path: (workspace: IWorkspaceSearchResult) => `/${workspace?.slug}/`,
    title: "Workspaces",
  },
  ...SEARCH_RESULTS_GROUPS_MAP_EXTENDED,
};
