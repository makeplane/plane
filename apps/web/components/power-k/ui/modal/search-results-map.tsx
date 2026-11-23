/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import {
  CyclesOutline,
  DocumentationOutline,
  GridOutline,
  ModuleOutline,
  ProjectsOutline,
  WorkItemsOutline,
} from "@makeplane/propel/icons";
// plane imports
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
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";

export type TPowerKSearchResultGroupDetails = {
  icon?: React.ComponentType<{ className?: string }>;
  /** Rendered before the name and kept out of its truncation, e.g. a work item identifier. */
  iconNode?: (item: any) => React.ReactNode;
  itemName: (item: any) => React.ReactNode;
  path: (item: any, projectId: string | undefined) => string;
  title: string;
};

export const POWER_K_SEARCH_RESULTS_GROUPS_MAP: Record<TPowerKSearchResultsKeys, TPowerKSearchResultGroupDetails> = {
  cycle: {
    icon: CyclesOutline,
    itemName: (cycle: IWorkspaceDefaultSearchResult) => (
      <p className="flex min-w-0 items-center gap-1">
        <span className="shrink-0 text-caption-sm-regular text-tertiary">{cycle.project__identifier}</span>
        <span className="truncate">{cycle.name}</span>
      </p>
    ),
    path: (cycle: IWorkspaceDefaultSearchResult) =>
      `/${cycle?.workspace__slug}/projects/${cycle?.project_id}/cycles/${cycle?.id}`,
    title: "Cycles",
  },
  issue: {
    iconNode: (workItem: IWorkspaceIssueSearchResult) => (
      <IssueIdentifier
        projectId={workItem.project_id}
        issueTypeId={workItem.type_id}
        projectIdentifier={workItem.project__identifier}
        issueSequenceId={workItem.sequence_id}
        size="xs"
      />
    ),
    itemName: (workItem: IWorkspaceIssueSearchResult) => workItem.name,
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
    icon: WorkItemsOutline,
    itemName: (view: IWorkspaceDefaultSearchResult) => (
      <p className="flex min-w-0 items-center gap-1">
        <span className="shrink-0 text-caption-sm-regular text-tertiary">{view.project__identifier}</span>
        <span className="truncate">{view.name}</span>
      </p>
    ),
    path: (view: IWorkspaceDefaultSearchResult) =>
      `/${view?.workspace__slug}/projects/${view?.project_id}/views/${view?.id}`,
    title: "Views",
  },
  module: {
    icon: ModuleOutline,
    itemName: (module: IWorkspaceDefaultSearchResult) => (
      <p className="flex min-w-0 items-center gap-1">
        <span className="shrink-0 text-caption-sm-regular text-tertiary">{module.project__identifier}</span>
        <span className="truncate">{module.name}</span>
      </p>
    ),
    path: (module: IWorkspaceDefaultSearchResult) =>
      `/${module?.workspace__slug}/projects/${module?.project_id}/modules/${module?.id}`,
    title: "Modules",
  },
  page: {
    icon: DocumentationOutline,
    itemName: (page: IWorkspacePageSearchResult) => (
      <p className="flex min-w-0 items-center gap-1">
        <span className="shrink-0 text-caption-sm-regular text-tertiary">{page.project__identifiers?.[0]}</span>
        <span className="truncate">{page.name}</span>
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
    icon: ProjectsOutline,
    itemName: (project: IWorkspaceProjectSearchResult) => project?.name,
    path: (project: IWorkspaceProjectSearchResult) => `/${project?.workspace__slug}/projects/${project?.id}/issues/`,
    title: "Projects",
  },
  workspace: {
    icon: GridOutline,
    itemName: (workspace: IWorkspaceSearchResult) => workspace?.name,
    path: (workspace: IWorkspaceSearchResult) => `/${workspace?.slug}/`,
    title: "Workspaces",
  },
};
