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

import type { FC } from "react";
import { useRef } from "react";
import { observer } from "mobx-react";
import { PlusIcon } from "@plane/propel/icons";
import { Button } from "@plane/propel/button";
import { Popover } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
// plane web components
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";
import { WorklogCreate } from "../create-update";

type TIssueActivityWorklogCreateButton = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const IssueActivityWorklogCreateButton = observer(function IssueActivityWorklogCreateButton(
  props: TIssueActivityWorklogCreateButton
) {
  const { workspaceSlug, projectId, issueId, disabled } = props;
  // hooks
  const { isWorklogsEnabledByProjectId } = useWorkspaceWorklogs();
  // ref
  const popoverButtonRef = useRef<HTMLButtonElement | null>(null);

  if (!isWorklogsEnabledByProjectId(projectId)) return <></>;
  return (
    <Popover
      popoverButtonRef={popoverButtonRef}
      disabled={disabled}
      buttonClassName={cn("w-full outline-none", { "cursor-not-allowed": disabled })}
      button={
        <Button variant="tertiary" prependIcon={<PlusIcon />} className="border-0">
          Log work
        </Button>
      }
      popperPosition="bottom-end"
      panelClassName="w-72 my-1 rounded-sm border-[0.5px] border-subtle-1 bg-surface-1 p-3 text-11 shadow-raised-200 focus:outline-none"
    >
      <WorklogCreate
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        handleClose={() => popoverButtonRef.current?.click()}
      />
    </Popover>
  );
});
