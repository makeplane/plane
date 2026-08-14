/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { highlightSearchMatches } from "./search-highlight";

export type TPowerKSearchResultGroupDetails = {
  icon?: React.ComponentType<{ className?: string }>;
  itemName: (item: any, searchTerm: string) => React.ReactNode;
  path: (item: any, projectId: string | undefined) => string;
  title: string;
};

export const POWER_K_SEARCH_RESULTS_GROUPS_MAP: Record<TPowerKSearchResultsKeys, TPowerKSearchResultGroupDetails> = {
  cycle: {
    icon: ContrastIcon,
    itemName: (cycle: IWorkspaceDefaultSearchResult, searchTerm: string) => (
      <p>
        <span className="text-11 text-tertiary">{cycle.project__identifier}</span>{" "}
        {highlightSearchMatches(cycle.name, searchTerm)}
      </p>
    ),
    path: (cycle: IWorkspaceDefaultSearchResult) =>
      `/${cycle?.workspace__slug}/projects/${cycle?.project_id}/cycles/${cycle?.id}`,
    title: "Cycles",
  },
  issue: {
    itemName: (workItem: IWorkspaceIssueSearchResult, searchTerm: string) => (
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <IssueIdentifier
            projectId={workItem.project_id}
            issueTypeId={workItem.type_id}
            projectIdentifier={workItem.project__identifier}
            issueSequenceId={workItem.sequence_id}
            size="xs"
          />
          <span className="truncate">{highlightSearchMatches(workItem.name, searchTerm)}</span>
        </div>
        {workItem.description_snippet && (
          <p className="mt-0.5 line-clamp-2 text-11 text-tertiary">
            {highlightSearchMatches(workItem.description_snippet, searchTerm)}
          </p>
        )}
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
    itemName: (view: IWorkspaceDefaultSearchResult, searchTerm: string) => (
      <p>
        <span className="text-11 text-tertiary">{view.project__identifier}</span>{" "}
        {highlightSearchMatches(view.name, searchTerm)}
      </p>
    ),
    path: (view: IWorkspaceDefaultSearchResult) =>
      `/${view?.workspace__slug}/projects/${view?.project_id}/views/${view?.id}`,
    title: "Views",
  },
  module: {
    icon: DiceIcon,
    itemName: (module: IWorkspaceDefaultSearchResult, searchTerm: string) => (
      <p>
        <span className="text-11 text-tertiary">{module.project__identifier}</span>{" "}
        {highlightSearchMatches(module.name, searchTerm)}
      </p>
    ),
    path: (module: IWorkspaceDefaultSearchResult) =>
      `/${module?.workspace__slug}/projects/${module?.project_id}/modules/${module?.id}`,
    title: "Modules",
  },
  page: {
    icon: FileText,
    itemName: (page: IWorkspacePageSearchResult, searchTerm: string) => (
      <p>
        <span className="text-11 text-tertiary">{page.project__identifiers?.[0]}</span>{" "}
        {highlightSearchMatches(page.name, searchTerm)}
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
    itemName: (project: IWorkspaceProjectSearchResult, searchTerm: string) =>
      highlightSearchMatches(project?.name, searchTerm),
    path: (project: IWorkspaceProjectSearchResult) => `/${project?.workspace__slug}/projects/${project?.id}/issues/`,
    title: "Projects",
  },
  workspace: {
    icon: LayoutGrid,
    itemName: (workspace: IWorkspaceSearchResult, searchTerm: string) =>
      highlightSearchMatches(workspace?.name, searchTerm),
    path: (workspace: IWorkspaceSearchResult) => `/${workspace?.slug}/`,
    title: "Workspaces",
  },
};
