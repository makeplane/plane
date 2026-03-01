/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { CheckIcon } from "@plane/propel/icons";
// plane imports
import type { IWorkspace } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { WorkspaceLogo } from "@/components/workspace/logo";
// plane web imports
import { SubscriptionPill } from "@/components/common/subscription/subscription-pill";

type TWorkspaceList = {
  selectedWorkspaceSlug: string | null;
  workspace: IWorkspace;
  handleWorkspaceSelection: (workspace: IWorkspace) => void;
};

export function WorkspaceList(props: TWorkspaceList) {
  const { selectedWorkspaceSlug, workspace, handleWorkspaceSelection } = props;

  return (
    <div className="w-full bg-surface-1 rounded">
      <div
        className={cn(
          "relative rounded-sm p-2.5 flex items-center justify-between gap-2 border-[0.5px] border-subtle-1 transition-all duration-200",
          {
            "bg-accent-primary/10 border-accent-strong": selectedWorkspaceSlug === workspace.slug,
            "hover:bg-accent-primary/5 hover:border-accent-strong": selectedWorkspaceSlug !== workspace.slug,
          }
        )}
        onClick={() => handleWorkspaceSelection(workspace)}
      >
        <div className="flex gap-2 items-center">
          <WorkspaceLogo logo={workspace.logo_url} name={workspace.name} classNames="text-13" />
          <div className="text-13 text-secondary font-medium">{workspace.name}</div>
        </div>
        <div className="flex items-center gap-2.5">
          <SubscriptionPill workspace={workspace} />
          {selectedWorkspaceSlug === workspace.slug && (
            <div
              className={cn(
                "absolute -right-1.5 top-0.5 -translate-y-1/2 size-3.5 bg-accent-primary rounded-full flex items-center justify-center"
              )}
            >
              <CheckIcon className="text-on-color size-2.5 m-auto" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
