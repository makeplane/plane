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

import { observer } from "mobx-react";
import { ArrowUpRight } from "lucide-react";
// plane imports
import type { TWorkItemRelationsSearchResponse } from "@plane/types";
import { generateWorkItemLink } from "@plane/utils";
// components
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
// hooks
import { useIssueTypes } from "@/plane-web/hooks/store";

type Props = {
  workspaceSlug: string;
  workItem: TWorkItemRelationsSearchResponse;
};

export const ParentIssuesListItem = observer(function ParentIssuesListItem(props: Props) {
  const { workspaceSlug, workItem } = props;
  // store hooks
  const { getIssueTypeById } = useIssueTypes();
  // derived values
  const isParentEpic = getIssueTypeById(workItem?.type_id || "")?.is_epic;

  return (
    <>
      <div className="grow flex items-center gap-2 truncate">
        <span
          className="size-1.5 shrink-0 rounded-full block"
          style={{
            backgroundColor: workItem.state.color,
          }}
        />
        <span className="shrink-0">
          <IssueIdentifier
            projectId={workItem.project.id}
            issueTypeId={workItem.type_id}
            projectIdentifier={workItem.project.identifier}
            issueSequenceId={workItem.sequence_id}
            variant="secondary"
            size="xs"
          />
        </span>{" "}
        <span className="truncate text-body-xs-medium">{workItem.name}</span>
      </div>
      <a
        href={generateWorkItemLink({
          workspaceSlug: workspaceSlug.toString(),
          projectId: workItem.project.id,
          issueId: workItem.id,
          projectIdentifier: workItem.project.identifier,
          sequenceId: workItem.sequence_id,
          isEpic: isParentEpic,
        })}
        target="_blank"
        className="z-1 relative hidden shrink-0 text-tertiary hover:text-primary group-hover:block"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        <ArrowUpRight className="size-4" />
      </a>
    </>
  );
});
