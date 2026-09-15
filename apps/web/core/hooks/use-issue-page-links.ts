/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo } from "react";
import useSWR, { mutate } from "swr";
// plane imports
import type { TIssuePageLink } from "@plane/types";
// services
import { IssueService } from "@/services/issue";

const issueService = new IssueService();

const getIssuePageLinksKey = (workspaceSlug: string, projectId: string) =>
  `ISSUE_PAGE_LINKS_${workspaceSlug}_${projectId}`;

/**
 * @description refetch the work item <-> page links of a project, call after linking/unlinking a page
 */
export const revalidateIssuePageLinks = (workspaceSlug: string, projectId: string) =>
  mutate(getIssuePageLinksKey(workspaceSlug, projectId));

/**
 * @description work item <-> page links of a project, shared (and de-duplicated) across every consumer via SWR
 */
export const useIssuePageLinks = (workspaceSlug: string | undefined, projectId: string | null | undefined) => {
  const { data: links } = useSWR(
    workspaceSlug && projectId ? getIssuePageLinksKey(workspaceSlug, projectId) : null,
    workspaceSlug && projectId ? () => issueService.fetchIssuePageLinks(workspaceSlug, projectId) : null,
    { revalidateOnFocus: false }
  );

  const { linksByIssueId, linksByPageId } = useMemo(() => {
    const byIssueId: Record<string, TIssuePageLink> = {};
    const byPageId: Record<string, TIssuePageLink> = {};
    for (const link of links ?? []) {
      byIssueId[link.issue_id] = link;
      byPageId[link.page_id] = link;
    }
    return { linksByIssueId: byIssueId, linksByPageId: byPageId };
  }, [links]);

  const getLinkByIssueId = useCallback((issueId: string) => linksByIssueId[issueId], [linksByIssueId]);
  const getLinkByPageId = useCallback((pageId: string) => linksByPageId[pageId], [linksByPageId]);

  return { links, getLinkByIssueId, getLinkByPageId };
};
