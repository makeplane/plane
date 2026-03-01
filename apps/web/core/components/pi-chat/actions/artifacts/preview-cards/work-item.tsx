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
import { useParams } from "next/navigation";
import { EpicIcon, LayersIcon } from "@plane/propel/icons";
// components
import { ReadonlyCycle } from "@/components/readonly/cycle";
import { ReadonlyLabels } from "@/components/readonly";
import { ReadonlyDate } from "@/components/readonly/date";
import { ReadonlyEstimate } from "@/components/readonly/estimate";
import { ReadonlyMember } from "@/components/readonly/member";
import { ReadonlyModule } from "@/components/readonly/module";
import { ReadonlyPriority } from "@/components/readonly/priority";
import { ReadonlyState } from "@/components/readonly/state";
import { useWorkItemData } from "../useArtifactData";
import { WithPreviewHOC } from "./with-preview-hoc";
import { IssueTypeIdentifier } from "@/components/issues/issue-detail/issue-identifier";
type TProps = {
  artifactId: string;
  isEpic?: boolean;
};

export const WorkItemPreviewCard = observer(function WorkItemPreviewCard(props: TProps) {
  const { artifactId, isEpic = false } = props;
  const data = useWorkItemData(artifactId);
  const { workspaceSlug } = useParams();
  return (
    <WithPreviewHOC artifactId={artifactId}>
      <div className="flex flex-col items-start">
        {/* header */}
        <div className="flex gap-2 items-center overflow-hidden w-full">
          {/* issue type icon */}
          {data.type_id ? (
            <IssueTypeIdentifier issueTypeId={data.type_id} />
          ) : isEpic ? (
            <EpicIcon className="size-4 rounded-sm text-secondary flex-shrink-0" />
          ) : (
            <LayersIcon className="size-4 rounded-sm flex-shrink-0" />
          )}
          {/* title */}
          <div className="truncate text-body-sm-medium text-start">{data.name}</div>
        </div>
        {/* properties */}
        <WithPreviewHOC.PreviewProperties>
          {data.state_id && workspaceSlug && (
            <ReadonlyState
              value={data.state_id}
              projectId={data.project_id ?? undefined}
              workspaceSlug={workspaceSlug?.toString()}
            />
          )}
          {data.priority && <ReadonlyPriority value={data.priority} />}
          {data.assignee_ids && data.assignee_ids?.length > 0 && (
            <ReadonlyMember
              projectId={data.project_id ?? undefined}
              value={data.assignee_ids ?? []}
              placeholder="Assignees"
              multiple
            />
          )}
          {data.label_ids && data.label_ids?.length > 0 && (
            <ReadonlyLabels
              value={data.label_ids ?? []}
              projectId={data.project_id ?? undefined}
              workspaceSlug={workspaceSlug?.toString()}
            />
          )}
          {data.start_date && <ReadonlyDate value={data.start_date ?? null} placeholder="Start date" />}
          {data.target_date && <ReadonlyDate value={data.target_date ?? null} placeholder="Due date" />}
          {data.cycle_id && (
            <ReadonlyCycle
              projectId={data.project_id ?? undefined}
              value={data.cycle_id ?? null}
              placeholder="Cycle"
              workspaceSlug={workspaceSlug?.toString()}
            />
          )}
          {data.module_ids && data.module_ids?.length > 0 && (
            <ReadonlyModule
              projectId={data.project_id ?? undefined}
              value={data.module_ids ?? []}
              placeholder="Modules"
              multiple
              workspaceSlug={workspaceSlug?.toString()}
            />
          )}
          {data.estimate_point && (
            <ReadonlyEstimate
              projectId={data.project_id ?? undefined}
              value={data.estimate_point ?? null}
              placeholder="Estimate"
              workspaceSlug={workspaceSlug?.toString()}
            />
          )}
        </WithPreviewHOC.PreviewProperties>
      </div>
    </WithPreviewHOC>
  );
});
