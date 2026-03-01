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

// types
import type {
  IWorkspaceDefaultEnhancedSearchResult,
  IWorkspaceIssueEnhancedSearchResult,
  IWorkspacePageEnhancedSearchResult,
  IWorkspaceProjectEnhancedSearchResult,
  IWorkspaceCommentEnhancedSearchResult,
} from "@plane/constants";
import { ESearchFilterKeys } from "@plane/constants";

// ui
import { Logo } from "@plane/propel/emoji-icon-picker";
import {
  CycleIcon,
  ModuleIcon,
  EpicIcon,
  WorkItemsIcon,
  PageIcon,
  ProjectIcon,
  TeamsIcon,
  ViewsIcon,
} from "@plane/propel/icons";
// plane web components
import { generateWorkItemLink } from "@plane/utils";
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
// core imports
import { IdentifierText } from "@/components/issues/issue-detail/identifier-text";
// local components
import { ActorAvatar, CommentItem } from "./comment-item";

export const SearchItems: {
  [key in ESearchFilterKeys]: {
    icon: (item: any) => React.ReactNode | null;
    itemName: (item: any) => React.ReactNode;
    path: (item: any) => string;
    title: string;
  };
} = {
  [ESearchFilterKeys.ALL]: {
    icon: () => null,
    itemName: () => null,
    path: () => "",
    title: "All",
  },
  [ESearchFilterKeys.CYCLE]: {
    icon: () => <CycleIcon className="size-4 my-auto" />,
    itemName: (cycle: IWorkspaceDefaultEnhancedSearchResult) => (
      <h6>
        <span className="text-11 text-tertiary">{cycle.project_identifier}</span> {cycle.name}
      </h6>
    ),
    path: (cycle: IWorkspaceDefaultEnhancedSearchResult) =>
      `/${cycle?.workspace_slug}/projects/${cycle?.project_id}/cycles/${cycle?.id}`,
    title: "Cycles",
  },
  [ESearchFilterKeys.WORK_ITEM]: {
    icon: (issue: IWorkspaceIssueEnhancedSearchResult) => (
      <>
        {issue.type_id ? (
          <IssueIdentifier
            projectId={issue.project_id}
            issueTypeId={issue.type_id}
            projectIdentifier={issue.project_identifier}
            issueSequenceId={issue.sequence_id}
            size="xs"
          />
        ) : (
          <div className="flex gap-2">
            <WorkItemsIcon width={16} height={16} className="my-auto" />
            <IdentifierText identifier={`${issue.project_identifier}-${issue.sequence_id}`} size="xs" />
          </div>
        )}
      </>
    ),
    itemName: (issue: IWorkspaceIssueEnhancedSearchResult) => <div className="flex">{issue.name}</div>,
    path: (issue: IWorkspaceIssueEnhancedSearchResult) =>
      generateWorkItemLink({
        workspaceSlug: issue?.workspace_slug,
        projectId: issue?.project_id,
        issueId: issue?.id,
        projectIdentifier: issue.project_identifier,
        sequenceId: issue?.sequence_id,
      }),
    title: "Work items",
  },
  [ESearchFilterKeys.VIEW]: {
    icon: () => <ViewsIcon className="size-4 my-auto" />,
    itemName: (view: IWorkspaceDefaultEnhancedSearchResult) => (
      <h6>
        <span className="text-11 text-tertiary">{view.project_identifier}</span> {view.name}
      </h6>
    ),
    path: (view: IWorkspaceDefaultEnhancedSearchResult) =>
      `/${view?.workspace_slug}/projects/${view?.project_id}/views/${view?.id}`,
    title: "Views",
  },
  [ESearchFilterKeys.MODULE]: {
    icon: () => <ModuleIcon className="size-4 my-auto" />,
    itemName: (module: IWorkspaceDefaultEnhancedSearchResult) => (
      <h6>
        <span className="text-11 text-tertiary">{module.project_identifier}</span> {module.name}
      </h6>
    ),
    path: (module: IWorkspaceDefaultEnhancedSearchResult) =>
      `/${module?.workspace_slug}/projects/${module?.project_id}/modules/${module?.id}`,
    title: "Modules",
  },
  [ESearchFilterKeys.PAGE]: {
    icon: () => <PageIcon className="size-4 my-auto" />,
    itemName: (page: IWorkspacePageEnhancedSearchResult) => (
      <h6>
        <span className="text-11 text-tertiary">{page.project_identifiers?.[0]}</span> {page.name}
      </h6>
    ),
    path: (page: IWorkspacePageEnhancedSearchResult) => {
      const redirectProjectId = page?.project_ids?.[0];
      return redirectProjectId
        ? `/${page?.workspace_slug}/projects/${redirectProjectId}/pages/${page?.id}`
        : `/${page?.workspace_slug}/wiki/${page?.id}`;
    },
    title: "Pages",
  },
  [ESearchFilterKeys.PROJECT]: {
    icon: (project: IWorkspaceProjectEnhancedSearchResult) =>
      project.logo_props ? <Logo logo={project?.logo_props} size={16} /> : <ProjectIcon className="size-4 my-auto" />,
    itemName: (project: IWorkspaceProjectEnhancedSearchResult) => project?.name,
    path: (project: IWorkspaceProjectEnhancedSearchResult) =>
      `/${project?.workspace_slug}/projects/${project?.id}/issues/`,
    title: "Projects",
  },
  [ESearchFilterKeys.EPIC]: {
    title: "Epics",
    icon: (epic: IWorkspaceIssueEnhancedSearchResult) => (
      <>
        {epic.type_id ? (
          <IssueIdentifier
            projectId={epic.project_id}
            issueTypeId={epic.type_id}
            projectIdentifier={epic.project_identifier}
            issueSequenceId={epic.sequence_id}
            size="xs"
          />
        ) : (
          <EpicIcon width={16} height={16} className="my-auto" />
        )}
      </>
    ),
    itemName: (epic: IWorkspaceIssueEnhancedSearchResult) => <div className="flex gap-2">{epic.name}</div>,
    path: (epic: IWorkspaceIssueEnhancedSearchResult) =>
      generateWorkItemLink({
        workspaceSlug: epic?.workspace_slug,
        projectId: epic?.project_id,
        issueId: epic?.id,
        projectIdentifier: epic.project_identifier,
        sequenceId: epic?.sequence_id,
        isEpic: true,
      }),
  },
  [ESearchFilterKeys.TEAMSPACE]: {
    title: "Teamspaces",
    icon: (teamspace: IWorkspaceDefaultEnhancedSearchResult) =>
      teamspace.logo_props ? <Logo logo={teamspace?.logo_props} size={16} /> : <TeamsIcon className="size-4 my-auto" />,
    itemName: (teamspace: IWorkspaceDefaultEnhancedSearchResult) => <h6>{teamspace.name}</h6>,
    path: (teamspace: IWorkspaceDefaultEnhancedSearchResult) =>
      `/${teamspace?.workspace_slug}/teamspaces/${teamspace?.id}`,
  },
  [ESearchFilterKeys.WORK_ITEM_COMMENT]: {
    title: "Comments",
    icon: (comment: IWorkspaceCommentEnhancedSearchResult) => <ActorAvatar actorId={comment.actor_id} size="sm" />,
    itemName: (comment: IWorkspaceCommentEnhancedSearchResult) => <CommentItem comment={comment} />,
    path: (comment: IWorkspaceCommentEnhancedSearchResult) => {
      const workItemLink = generateWorkItemLink({
        workspaceSlug: comment?.workspace_slug,
        projectId: comment?.project_id,
        issueId: comment?.issue_id,
        projectIdentifier: comment?.project_identifier,
        sequenceId: comment?.issue_sequence_id,
      });
      const commentLink = `${workItemLink}#comment-${comment?.id}`;
      return commentLink;
    },
  },
};
