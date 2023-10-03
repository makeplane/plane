// types
import { localized } from "helpers/localization.helper";
import {
  IWorkspaceDefaultSearchResult,
  IWorkspaceIssueSearchResult,
  IWorkspaceProjectSearchResult,
  IWorkspaceSearchResult,
} from "types";

export const commandGroups: {
  [key: string]: {
    icon: string;
    itemName: (item: any) => React.ReactNode;
    path: (item: any) => string;
    title: string;
  };
} = {
  cycle: {
    icon: "contrast",
    itemName: (cycle: IWorkspaceDefaultSearchResult) => (
      <h6>
        <span className="text-custom-text-200 text-xs">{cycle.project__identifier}</span>
        {"- "}
        {cycle.name}
      </h6>
    ),
    path: (cycle: IWorkspaceDefaultSearchResult) =>
      `/${cycle?.workspace__slug}/projects/${cycle?.project_id}/cycles/${cycle?.id}`,
    title: localized("Cycles"),
  },
  issue: {
    icon: "stack",
    itemName: (issue: IWorkspaceIssueSearchResult) => (
      <h6>
        <span className="text-custom-text-200 text-xs">{issue.project__identifier}</span>
        {"- "}
        {issue.name}
      </h6>
    ),
    path: (issue: IWorkspaceIssueSearchResult) =>
      `/${issue?.workspace__slug}/projects/${issue?.project_id}/issues/${issue?.id}`,
    title: localized("Issues"),
  },
  issue_view: {
    icon: "photo_filter",
    itemName: (view: IWorkspaceDefaultSearchResult) => (
      <h6>
        <span className="text-custom-text-200 text-xs">{view.project__identifier}</span>
        {"- "}
        {view.name}
      </h6>
    ),
    path: (view: IWorkspaceDefaultSearchResult) =>
      `/${view?.workspace__slug}/projects/${view?.project_id}/views/${view?.id}`,
    title: localized("Views"),
  },
  module: {
    icon: "dataset",
    itemName: (module: IWorkspaceDefaultSearchResult) => (
      <h6>
        <span className="text-custom-text-200 text-xs">{module.project__identifier}</span>
        {"- "}
        {module.name}
      </h6>
    ),
    path: (module: IWorkspaceDefaultSearchResult) =>
      `/${module?.workspace__slug}/projects/${module?.project_id}/modules/${module?.id}`,
    title: localized("Modules"),
  },
  page: {
    icon: "article",
    itemName: (page: IWorkspaceDefaultSearchResult) => (
      <h6>
        <span className="text-custom-text-200 text-xs">{page.project__identifier}</span>
        {"- "}
        {page.name}
      </h6>
    ),
    path: (page: IWorkspaceDefaultSearchResult) =>
      `/${page?.workspace__slug}/projects/${page?.project_id}/pages/${page?.id}`,
    title: localized("Pages"),
  },
  project: {
    icon: "work",
    itemName: (project: IWorkspaceProjectSearchResult) => project?.name,
    path: (project: IWorkspaceProjectSearchResult) =>
      `/${project?.workspace__slug}/projects/${project?.id}/issues/`,
    title: localized("Projects"),
  },
  workspace: {
    icon: "grid_view",
    itemName: (workspace: IWorkspaceSearchResult) => workspace?.name,
    path: (workspace: IWorkspaceSearchResult) => `/${workspace?.slug}/`,
    title: localized("Workspaces"),
  },
};
