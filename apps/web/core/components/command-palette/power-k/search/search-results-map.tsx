/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { FileText, LayoutGrid } from "lucide-react";
// plane imports
import { InitiativeIcon, TeamsIcon } from "@plane/propel/icons";
import type {
  IWorkspaceDefaultSearchResult,
  IWorkspaceIssueSearchResult,
  IWorkspaceSearchResult,
  IWorkspaceInitiativeSearchResult,
  IWorkspaceTeamspaceSearchResult,
} from "@plane/types";
import { generateWorkItemLink } from "@plane/utils";
// components
import type { TPowerKSearchResultGroupDetails } from "@/components/power-k/ui/modal/search-results-map";
// plane web imports
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
// local imports
import type { TPowerKSearchResultsKeysExtended } from "../types";

type TSearchResultsGroupsMapExtended = Record<TPowerKSearchResultsKeysExtended, TPowerKSearchResultGroupDetails>;

export const SEARCH_RESULTS_GROUPS_MAP_EXTENDED: TSearchResultsGroupsMapExtended = {
  epic: {
    title: "Epics",
    itemName: (epic: IWorkspaceIssueSearchResult) => (
      <div className="flex gap-2">
        <IssueIdentifier
          projectId={epic.project_id}
          issueTypeId={epic.type_id}
          projectIdentifier={epic.project__identifier}
          issueSequenceId={epic.sequence_id}
          size="xs"
          variant="secondary"
        />{" "}
        {epic.name}
      </div>
    ),
    path: (epic: IWorkspaceIssueSearchResult) =>
      generateWorkItemLink({
        workspaceSlug: epic?.workspace__slug,
        projectId: epic?.project_id,
        issueId: epic?.id,
        projectIdentifier: epic.project__identifier,
        sequenceId: epic?.sequence_id,
        isEpic: true,
      }),
  },
  team: {
    title: "Teamspaces",
    icon: TeamsIcon,
    itemName: (team: IWorkspaceTeamspaceSearchResult) => team?.name,
    path: (team: IWorkspaceTeamspaceSearchResult) => `/${team?.workspace__slug}/teamspaces/${team?.id}`,
  },
  initiative: {
    title: "Initiatives",
    icon: InitiativeIcon,
    itemName: (initiative: IWorkspaceInitiativeSearchResult) => initiative?.name,
    path: (initiative: IWorkspaceInitiativeSearchResult) =>
      `/${initiative?.workspace__slug}/initiatives/${initiative?.id}`,
  },
};

export const pagesAppCommandGroups = {
  page: {
    icon: <FileText className="size-3" />,
    itemName: (page: IWorkspaceDefaultSearchResult) => page?.name,
    path: (page: IWorkspaceDefaultSearchResult) => `/${page?.workspace__slug}/wiki/${page?.id}`,
    title: "Pages",
  },
  workspace: {
    icon: <LayoutGrid className="size-3" />,
    itemName: (workspace: IWorkspaceSearchResult) => workspace?.name,
    path: (workspace: IWorkspaceSearchResult) => `/${workspace?.slug}/wiki`,
    title: "Workspaces",
  },
};
