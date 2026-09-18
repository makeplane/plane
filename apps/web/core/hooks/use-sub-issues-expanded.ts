/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { EIssueServiceType } from "@plane/types";
// components
import { useSubIssueOperations } from "@/components/issues/issue-detail-widgets/sub-issues/helper";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { getValueFromLocalStorage, setValueIntoLocalStorage } from "@/hooks/use-local-storage";

const STORAGE_KEY = "expanded_sub_issues";

/**
 * Sub-issue expand/collapse state of a work item row, persisted in local storage
 * so it survives page refreshes.
 */
export const useSubIssuesExpanded = (issueId: string, isEpic = false) => {
  const { workspaceSlug } = useParams();
  const { issueMap } = useIssues();
  // shows an error toast if the fetch fails
  const { fetchSubIssues } = useSubIssueOperations(isEpic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES);
  const [isExpanded, setExpanded] = useState<boolean>(() =>
    getValueFromLocalStorage(STORAGE_KEY, []).includes(issueId)
  );
  const projectId = issueMap[issueId]?.project_id;

  // sub-issues are normally fetched when the row is toggled open,
  // so a row restored as expanded has to fetch them once itself
  const shouldFetchOnRestore = useRef(isExpanded);
  useEffect(() => {
    if (!shouldFetchOnRestore.current || !workspaceSlug || !projectId) return;
    shouldFetchOnRestore.current = false;
    void fetchSubIssues(workspaceSlug.toString(), projectId, issueId);
  }, [workspaceSlug, projectId, issueId, fetchSubIssues]);

  useEffect(() => {
    const expandedIds: string[] = getValueFromLocalStorage(STORAGE_KEY, []);
    if (expandedIds.includes(issueId) === isExpanded) return;
    setValueIntoLocalStorage(
      STORAGE_KEY,
      isExpanded ? [...expandedIds, issueId] : expandedIds.filter((id) => id !== issueId)
    );
  }, [issueId, isExpanded]);

  return [isExpanded, setExpanded] as const;
};
