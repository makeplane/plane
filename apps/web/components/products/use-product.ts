/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import useSWR from "swr";
// plane imports
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import type { TIssue, TProductDetail } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// services
import { IssueService } from "@/services/issue";
// local imports
import { getProductErrorKey } from "./helper";

const issueService = new IssueService();

/** Saves the kind or the product fields of a work item. Resolves to whether it succeeded. */
export const useProductUpdate = (workspaceSlug: string, projectId: string, issueId: string) => {
  const { t } = useTranslation();
  const { fetchIssue, fetchActivities } = useIssueDetail();

  return useCallback(
    async (payload: Partial<TIssue>): Promise<boolean> => {
      try {
        // not through the store: it would merge a partial product over the whole one
        await issueService.patchIssue(workspaceSlug, projectId, issueId, payload);
      } catch (error) {
        setToast({ type: "error", title: t("toast.error"), message: t(getProductErrorKey(error)) });
        return false;
      }
      await fetchIssue(workspaceSlug, projectId, issueId);
      await fetchActivities(workspaceSlug, projectId, issueId);
      return true;
    },
    [workspaceSlug, projectId, issueId, fetchIssue, fetchActivities, t]
  );
};

/** Product fields with progress. Reloads when something the progress depends on changes. */
export const useProduct = (workspaceSlug: string, projectId: string, issueId: string) => {
  const {
    issue: { getIssueById },
    subIssues: { stateDistributionByIssueId },
  } = useIssueDetail();
  const issue = getIssueById(issueId);
  const key = JSON.stringify([
    issue?.state_id,
    issue?.start_date,
    issue?.target_date,
    stateDistributionByIssueId(issueId),
  ]);
  const { data, mutate } = useSWR(
    issue?.kind === "product" ? ["PRODUCT", workspaceSlug, projectId, issueId, key] : null,
    () => issueService.retrieve(workspaceSlug, projectId, issueId),
    { keepPreviousData: true, revalidateOnFocus: false }
  );
  const product = data?.id === issueId ? (data.product as TProductDetail | null | undefined) : undefined;

  return { product, reload: mutate };
};
