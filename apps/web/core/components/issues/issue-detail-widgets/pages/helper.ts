/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TPage } from "@plane/types";
import { IssuePageService, type TWorkItemPage } from "@/services/issue";
import { ProjectPageService, WorkspacePageService } from "@/services/page";

export function useIssuePages(workspaceSlug: string, projectId: string, issueId: string) {
  const issuePageService = useMemo(() => new IssuePageService(), []);
  const projectPageService = useMemo(() => new ProjectPageService(), []);
  const workspacePageService = useMemo(() => new WorkspacePageService(), []);
  const [links, setLinks] = useState<TWorkItemPage[]>([]);
  const [pages, setPages] = useState<TPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!workspaceSlug || !projectId || !issueId) return;
    setIsLoading(true);
    try {
      const [linkedPages, projectPages, workspacePages] = await Promise.all([
        issuePageService.list(workspaceSlug, projectId, issueId),
        projectPageService.fetchAll(workspaceSlug, projectId),
        workspacePageService.fetchAll(workspaceSlug),
      ]);
      const pageMap = new Map<string, TPage>();
      [...projectPages, ...workspacePages].forEach((page) => {
        if (page.id) pageMap.set(page.id, page);
      });
      linkedPages.forEach((link) => {
        if (link.page?.id) pageMap.set(link.page.id, link.page);
      });
      setLinks(linkedPages);
      setPages([...pageMap.values()]);
    } finally {
      setIsLoading(false);
    }
  }, [issueId, issuePageService, projectId, projectPageService, workspacePageService, workspaceSlug]);

  useEffect(() => {
    refresh().catch(() => setIsLoading(false));
  }, [refresh]);

  const attach = useCallback(
    async (pageId: string) => {
      const link = await issuePageService.create(workspaceSlug, projectId, issueId, pageId);
      setLinks((current) => [link, ...current.filter((item) => item.id !== link.id)]);
    },
    [issueId, issuePageService, projectId, workspaceSlug]
  );

  const detach = useCallback(
    async (linkId: string) => {
      await issuePageService.remove(workspaceSlug, projectId, issueId, linkId);
      setLinks((current) => current.filter((item) => item.id !== linkId));
    },
    [issueId, issuePageService, projectId, workspaceSlug]
  );

  return { links, pages, isLoading, refresh, attach, detach };
}
