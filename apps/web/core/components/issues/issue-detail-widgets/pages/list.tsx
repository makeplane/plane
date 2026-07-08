/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import type { TIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import type { TPageOperations } from "./helper";
import { IssuePageItem } from "./item";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  pageOperations: TPageOperations;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const IssuePagesList = observer(function IssuePagesList(props: Props) {
  const { workspaceSlug, projectId, issueId, pageOperations, disabled = false, issueServiceType } = props;
  // store hooks
  const {
    issuePage: { getIssuePageIds },
  } = useIssueDetail(issueServiceType);
  // derived values
  const issuePageIds = getIssuePageIds(issueId);

  if (!issuePageIds || issuePageIds.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 pt-4">
      {issuePageIds.map((pageId) => (
        <IssuePageItem
          key={pageId}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          pageId={pageId}
          pageOperations={pageOperations}
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      ))}
    </div>
  );
});
