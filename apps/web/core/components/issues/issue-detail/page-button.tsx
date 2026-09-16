/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Link } from "react-router";
// plane imports
import { PageIcon } from "@plane/propel/icons";
import { getPageName } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

/**
 * @description opens the work item's linked page in a single click, shown under the title
 */
export const IssuePageButton = observer(function IssuePageButton(props: Props) {
  const { workspaceSlug, projectId, issueId } = props;
  // store hooks
  const {
    page: { getPageByIssueId },
  } = useIssueDetail();
  // derived values
  const issuePage = getPageByIssueId(issueId);

  if (!issuePage) return null;

  const pageProjectId = issuePage.page_detail?.project_ids?.[0] ?? projectId;

  return (
    <Link
      to={`/${workspaceSlug}/projects/${pageProjectId}/pages/${issuePage.page}`}
      className="inline-flex max-w-full items-center gap-2 rounded-md border-[0.5px] border-subtle bg-layer-1 px-2.5 py-1.5 text-13 font-medium text-primary hover:bg-layer-1-hover"
    >
      <PageIcon className="size-4 flex-shrink-0 text-tertiary" />
      <span className="truncate">{getPageName(issuePage.page_detail?.name)}</span>
      <span className="flex-shrink-0 text-11 font-normal text-tertiary">Open page</span>
    </Link>
  );
});
