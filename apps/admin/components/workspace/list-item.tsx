/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";

// plane internal packages
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { WorkspaceAvatar } from "@makeplane/propel/components/workspace-avatar";
import { NewTabOutline } from "@makeplane/propel/icons";
import { WEB_BASE_URL } from "@plane/constants";
import { getFileURL } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store";

type TWorkspaceListItemProps = {
  workspaceId: string;
};

export const WorkspaceListItem = observer(function WorkspaceListItem({ workspaceId }: TWorkspaceListItemProps) {
  // store hooks
  const { getWorkspaceById } = useWorkspace();
  // derived values
  const workspace = getWorkspaceById(workspaceId);

  if (!workspace) return null;
  return (
    <a
      key={workspaceId}
      href={`${WEB_BASE_URL}/${encodeURIComponent(workspace.slug)}`}
      target="_blank"
      className="group flex min-w-0 items-center justify-between gap-2.5 rounded-lg border border-subtle bg-layer-1 p-3 hover:border-subtle-1 hover:bg-layer-1-hover hover:shadow-raised-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-strong focus-visible:outline-solid"
      rel="noreferrer"
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <span className="mt-1 flex flex-shrink-0">
          <WorkspaceAvatar
            size="lg"
            src={workspace?.logo_url && workspace.logo_url !== "" ? getFileURL(workspace.logo_url) : undefined}
            fallback={<span className="uppercase">{workspace?.name?.[0] ?? "..."}</span>}
          />
        </span>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2.5">
            <h3 className="max-w-full truncate text-body-sm-medium capitalize" title={workspace.name}>
              {workspace.name}
            </h3>
            <div className="flex max-w-full min-w-0 items-center gap-2.5">
              <span className="shrink-0">/</span>
              <Tooltip label="The unique URL of your workspace">
                <h4 className="min-w-0 truncate text-body-xs-regular text-tertiary" title={workspace.slug}>
                  [{workspace.slug}]
                </h4>
              </Tooltip>
            </div>
          </div>
          {workspace.owner.email && (
            <div className="flex w-full min-w-0 items-center gap-1 text-caption-sm-regular">
              <h3 className="shrink-0 font-medium text-secondary">Owned by:</h3>
              <h4 className="truncate text-tertiary" title={workspace.owner.email}>
                {workspace.owner.email}
              </h4>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2.5 gap-y-1 text-caption-sm-regular">
            {workspace.total_projects !== null && (
              <span className="flex items-center gap-1">
                <h3 className="font-medium text-secondary">Total projects:</h3>
                <h4 className="text-tertiary">{workspace.total_projects}</h4>
              </span>
            )}
            {workspace.total_members !== null && (
              <span className="flex items-center gap-2.5">
                •
                <span className="flex items-center gap-1">
                  <h3 className="font-medium text-secondary">Total members:</h3>
                  <h4 className="text-tertiary">{workspace.total_members}</h4>
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex-shrink-0">
        <NewTabOutline width={14} height={16} className="text-placeholder group-hover:text-secondary" />
      </div>
    </a>
  );
});
