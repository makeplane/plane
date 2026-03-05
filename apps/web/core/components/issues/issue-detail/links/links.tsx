/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// computed
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { IssueLinkDetail } from "./link-detail";
// hooks
import type { TLinkOperations } from "./root";

export type TLinkOperationsModal = Exclude<TLinkOperations, "create">;

export type TIssueLinkList = {
  issueId: string;
  linkOperations: TLinkOperationsModal;
  disabled?: boolean;
};

export const IssueLinkList = observer(function IssueLinkList(props: TIssueLinkList) {
  // props
  const { issueId, linkOperations, disabled = false } = props;
  // hooks
  const {
    link: { getLinksByIssueId },
  } = useIssueDetail();

  const issueLinks = getLinksByIssueId(issueId);

  if (!issueLinks) return <></>;

  return (
    <div className="space-y-2">
      {issueLinks &&
        issueLinks.length > 0 &&
        issueLinks.map((linkId) => (
          <IssueLinkDetail key={linkId} linkId={linkId} linkOperations={linkOperations} isNotAllowed={disabled} />
        ))}
    </div>
  );
});
