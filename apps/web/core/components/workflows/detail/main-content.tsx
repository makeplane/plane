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

import { useWorkflows } from "@/hooks/store/use-workflows";
import { ScrollArea } from "@plane/propel/scrollarea";
import { cn } from "@plane/utils";
import { observer } from "mobx-react";
import { WorkflowStatesListRoot } from "./states-list/root";
import { useEffect } from "react";
import { useIssueTypes } from "@/plane-web/hooks/store";
import { IssueTypeIdentifier } from "@/components/issues/issue-detail/issue-identifier";

type Props = {
  workspaceSlug: string;
  projectId: string;
  workflowId: string;
};

export const WorkflowDetailMainContent = observer(function WorkflowDetailMainContent(props: Props) {
  // props
  const { workspaceSlug, projectId, workflowId } = props;
  // store
  const { getWorkflowById } = useWorkflows();
  const { getIssueTypeById } = useIssueTypes();

  // derived values
  const workflow = getWorkflowById(workflowId);

  // On unmount clear any draft transitions and close sidebar
  useEffect(() => {
    return () => {
      if (workflow) {
        workflow.clearDraftTransitions();
        workflow.closeSidebar();
      }
    };
  }, [workflow]);

  if (!workflow) return <></>;

  const hugging = workflow?.isSidebarOpen;

  return (
    <>
      <ScrollArea scrollType="hover" orientation="vertical" size="sm" className="grow size-full overflow-y-scroll">
        <div className={cn("py-9 w-full max-w-225 mx-auto px-page-x")}>
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-3">
              <p className="text-h3-medium">{workflow.name}</p>
              <p className="text-body-xs-regular">{workflow.description}</p>
              {workflow.is_default || workflow.work_item_type_ids.length === 0 ? null : (
                <div className="flex flex-col gap-2">
                  <p className="text-body-xs-medium">Work item type</p>
                  <div className="flex-1 px-3 py-2 rounded-lg border border-subtle flex items-center gap-2">
                    {workflow.work_item_type_ids.map((typeId) => {
                      const type = getIssueTypeById(typeId);
                      return (
                        <div className="flex items-center gap-2 rounded-md p-1 border border-subtle" key={typeId}>
                          <IssueTypeIdentifier issueTypeId={typeId} size="xs" />
                          <span className="text-caption-md-regular">{type?.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <WorkflowStatesListRoot workspaceSlug={workspaceSlug} projectId={projectId} workflow={workflow} />
          </div>
        </div>
      </ScrollArea>
    </>
  );
});
