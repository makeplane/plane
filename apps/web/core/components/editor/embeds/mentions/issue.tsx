/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Link } from "react-router";
import { generateWorkItemLink } from "@plane/utils";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type Props = {
  id: string;
  entityDisplayName?: string | null;
};

export const EditorIssueMention = observer(function EditorIssueMention(props: Props) {
  const { id, entityDisplayName } = props;
  const { workspaceSlug } = useParams();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const issue = getIssueById(id);

  const [projectIdentifier, sequenceId] = entityDisplayName?.split("-") ?? [];
  const href =
    workspaceSlug && projectIdentifier && sequenceId
      ? generateWorkItemLink({
          workspaceSlug: workspaceSlug.toString(),
          projectIdentifier,
          sequenceId,
          issueId: id,
          projectId: issue?.project_id,
        })
      : "#";

  const label = entityDisplayName ?? issue?.name ?? "work item";

  return (
    <span className="not-prose inline rounded-sm bg-accent-subtle-active px-1 py-0.5 text-accent-primary no-underline">
      <Link to={href}>{label}</Link>
    </span>
  );
});
