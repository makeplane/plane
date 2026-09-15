/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Link } from "react-router";
// plane imports
import { PageIcon } from "@plane/propel/icons";
import type { TIssue } from "@plane/types";
import { Row } from "@plane/ui";
// hooks
import { useIssuePageLinks } from "@/hooks/use-issue-page-links";

type Props = {
  issue: TIssue;
};

export const SpreadsheetPageColumn = observer(function SpreadsheetPageColumn(props: Props) {
  const { issue } = props;
  // router
  const { workspaceSlug } = useParams();
  // linked page
  const { getLinkByIssueId } = useIssuePageLinks(workspaceSlug?.toString(), issue.project_id);
  const pageLink = getLinkByIssueId(issue.id);

  return (
    <Row className="flex h-11 w-full items-center border-b-[0.5px] border-subtle px-2.5 px-page-x py-1 text-11 group-[.selected-issue-row]:bg-accent-primary/5 hover:bg-layer-1 group-[.selected-issue-row]:hover:bg-accent-primary/10">
      {pageLink ? (
        <Link
          to={`/${workspaceSlug}/projects/${pageLink.issue_project_id}/pages/${pageLink.page_id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 truncate hover:underline"
        >
          <PageIcon className="size-3.5 flex-shrink-0 text-tertiary" />
          <span className="truncate">{pageLink.page_name || "Untitled"}</span>
        </Link>
      ) : (
        <span className="text-placeholder">-</span>
      )}
    </Row>
  );
});
