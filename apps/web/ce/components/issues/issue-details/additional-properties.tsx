/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { GitCommitHorizontal } from "lucide-react";
// plane imports
import { GitlabIcon } from "@plane/propel/icons";
// components
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
// services
import { ProjectGitLabService } from "@/services/project/gitlab.service";

export type TWorkItemAdditionalSidebarProperties = {
  workItemId: string;
  workItemTypeId: string | null;
  projectId: string;
  workspaceSlug: string;
  isEditable: boolean;
  isPeekView?: boolean;
};

type TIssueGitLabMeta = {
  mr_status: string;
  mr_url: string;
  mr_iid: number | null;
  mr_title: string;
  commit_count: number;
  last_synced_at: string | null;
};

const formatMrStatus = (status: string) => {
  if (!status) return "—";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

function GitlabSidebarIcon({ className }: { className?: string }) {
  return <GitlabIcon width="16" height="16" className={className} />;
}

function CommitsSidebarIcon({ className }: { className?: string }) {
  return <GitCommitHorizontal className={className} />;
}

export const WorkItemAdditionalSidebarProperties = observer(function WorkItemAdditionalSidebarProperties(
  props: TWorkItemAdditionalSidebarProperties
) {
  const { workItemId, projectId, workspaceSlug } = props;
  const [meta, setMeta] = useState<TIssueGitLabMeta | null>(null);

  useEffect(() => {
    if (!workspaceSlug || !projectId || !workItemId) return;
    const service = new ProjectGitLabService();
    let cancelled = false;
    service
      .getIssueGitLabMeta(workspaceSlug, projectId, workItemId)
      .then((data) => {
        if (!cancelled) setMeta(data);
      })
      .catch(() => {
        if (!cancelled) setMeta(null);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceSlug, projectId, workItemId]);

  if (!meta || (!meta.mr_status && meta.commit_count === 0)) {
    return null;
  }

  return (
    <>
      {meta.mr_status ? (
        <SidebarPropertyListItem icon={GitlabSidebarIcon} label="MR status">
          {meta.mr_url ? (
            <a
              href={meta.mr_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-custom-primary-100 hover:underline"
            >
              {formatMrStatus(meta.mr_status)}
              {meta.mr_iid != null ? ` !${meta.mr_iid}` : ""}
            </a>
          ) : (
            <span className="text-sm">{formatMrStatus(meta.mr_status)}</span>
          )}
        </SidebarPropertyListItem>
      ) : null}

      <SidebarPropertyListItem icon={CommitsSidebarIcon} label="Commits">
        <span className="text-sm">{meta.commit_count}</span>
      </SidebarPropertyListItem>
    </>
  );
});
