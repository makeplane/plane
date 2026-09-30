/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TPage } from "@plane/types";
import { IssuePageService, type TWorkItemPage } from "@/services/issue";
import { ProjectPageService, WorkspacePageService } from "@/services/page";

type TIssuePagesErrors = {
  linked: boolean;
  available: boolean;
};

export function useIssuePages(workspaceSlug: string, projectId: string, issueId: string, pickerOpen: boolean) {
  const issuePageService = useMemo(() => new IssuePageService(), []);
  const projectPageService = useMemo(() => new ProjectPageService(), []);
  const workspacePageService = useMemo(() => new WorkspacePageService(), []);
  const [links, setLinks] = useState<TWorkItemPage[]>([]);
  const [pages, setPages] = useState<TPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [errors, setErrors] = useState<TIssuePagesErrors>({ linked: false, available: false });
  const mutationVersionRef = useRef(0);

  const refreshLinks = useCallback(async () => {
    if (!workspaceSlug || !projectId || !issueId) return;
    setIsLoading(true);
    setErrors((current) => ({ ...current, linked: false }));
    const mutationVersion = mutationVersionRef.current;

    try {
      const nextLinks = await issuePageService.list(workspaceSlug, projectId, issueId);
      if (mutationVersionRef.current === mutationVersion) {
        setLinks(nextLinks);
      }
    } catch {
      setErrors((current) => ({ ...current, linked: true }));
    } finally {
      setIsLoading(false);
    }
  }, [issueId, issuePageService, projectId, workspaceSlug]);

  const refreshAvailablePages = useCallback(async () => {
    if (!workspaceSlug || !projectId || !issueId) return;
    setIsLoadingAvailable(true);
    setErrors((current) => ({ ...current, available: false }));

    try {
      const [projectResult, workspaceResult] = await Promise.allSettled([
        projectPageService.fetchAll(workspaceSlug, projectId),
        workspacePageService.fetchAll(workspaceSlug),
      ]);
      const pageMap = new Map<string, TPage>();

      if (projectResult.status === "fulfilled") {
        projectResult.value.forEach((page) => {
          if (page.id) pageMap.set(page.id, page);
        });
      }

      if (workspaceResult.status === "fulfilled") {
        workspaceResult.value.forEach((page) => {
          if (page.id) pageMap.set(page.id, page);
        });
      }

      setPages([...pageMap.values()]);
      setErrors((current) => ({
        ...current,
        available: projectResult.status === "rejected" || workspaceResult.status === "rejected",
      }));
    } finally {
      setIsLoadingAvailable(false);
    }
  }, [issueId, projectId, projectPageService, workspacePageService, workspaceSlug]);

  const refresh = useCallback(async () => {
    await Promise.all([refreshLinks(), pickerOpen ? refreshAvailablePages() : Promise.resolve()]);
  }, [pickerOpen, refreshAvailablePages, refreshLinks]);

  useEffect(() => {
    refresh().catch(() => setIsLoading(false));
  }, [refresh]);

  const attach = useCallback(
    async (pageId: string) => {
      const link = await issuePageService.create(workspaceSlug, projectId, issueId, pageId);
      mutationVersionRef.current += 1;
      setLinks((current) => [link, ...current.filter((item) => item.id !== link.id)]);
    },
    [issueId, issuePageService, projectId, workspaceSlug]
  );

  const detach = useCallback(
    async (linkId: string) => {
      await issuePageService.remove(workspaceSlug, projectId, issueId, linkId);
      mutationVersionRef.current += 1;
      setLinks((current) => current.filter((item) => item.id !== linkId));
    },
    [issueId, issuePageService, projectId, workspaceSlug]
  );

  return { links, pages, errors, isLoading, isLoadingAvailable, refresh, attach, detach };
}
