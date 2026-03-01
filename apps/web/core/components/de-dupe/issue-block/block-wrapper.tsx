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

import React from "react";
import { observer } from "mobx-react";
// plane imports
import type { TDeDupeIssue } from "@plane/types";
import { ControlLink } from "@plane/ui";
import { cn, generateWorkItemLink } from "@plane/utils";
// hooks
import { useProject } from "@/hooks/store/use-project";

type TDeDupeIssueBlockWrapperProps = {
  workspaceSlug: string;
  issue: TDeDupeIssue;
  children: React.ReactNode;
  isSelected?: boolean;
};

export const DeDupeIssueBlockWrapper = observer(function DeDupeIssueBlockWrapper(props: TDeDupeIssueBlockWrapperProps) {
  const { workspaceSlug, issue, isSelected = false, children } = props;
  // store hooks
  const { getProjectIdentifierById } = useProject();

  // derived values
  const projectIdentifier = getProjectIdentifierById(issue?.project_id);

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: issue?.project_id,
    issueId: issue?.id,
    projectIdentifier,
    sequenceId: issue?.sequence_id,
  });

  // handlers
  const handleRedirection = () => window.open(workItemLink, "_blank");

  return (
    <ControlLink
      href={workItemLink}
      className={cn(
        "group relative flex flex-col gap-3.5 w-80  rounded-lg px-3 py-2 bg-surface-1 border border-accent-strong/10",
        {
          "border-accent-strong/50 ": isSelected,
        }
      )}
      onClick={handleRedirection}
    >
      {children}
    </ControlLink>
  );
});
