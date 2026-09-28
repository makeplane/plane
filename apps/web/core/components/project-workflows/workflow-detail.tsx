/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { IWorkflow, IWorkflowTypeAssignment } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import {
  WorkflowPublish,
  WorkflowStates,
  WorkflowTransitions,
  WorkflowTypeAssignments,
} from "@/components/project-workflows";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkflow } from "@/hooks/store/use-workflow";

type TWorkflowDetailProps = {
  workspaceSlug: string;
  projectId: string;
  workflow: IWorkflow;
  typeAssignments: IWorkflowTypeAssignment[] | undefined;
  isEditable: boolean;
};

export const WorkflowDetail = observer(function WorkflowDetail(props: TWorkflowDetailProps) {
  const { workspaceSlug, projectId, workflow, typeAssignments, isEditable } = props;
  const { t } = useTranslation();
  // hooks
  const { projectStates } = useProjectState();
  const workflowStore = useWorkflow();

  const draft = workflowStore.getDraftRevisionByWorkflowId(workflow.id);
  const published = workflowStore.getPublishedRevisionByWorkflowId(workflow.id);
  const revision = draft ?? published;
  // §17.2 — only draft revisions are mutable. The published revision stays
  // visible for reference but is read-only.
  const isRevisionEditable = isEditable && Boolean(draft);

  const isLoading = workflowStore.detailLoadingMap[workflow.id];
  const getFlowActors = useCallback((flowId: string) => workflowStore.getFlowActors(flowId), [workflowStore]);

  if (isLoading && !revision) {
    return (
      <Loader className="space-y-3">
        <Loader.Item height="40px" />
        <Loader.Item height="120px" />
        <Loader.Item height="120px" />
      </Loader>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <WorkflowPublish
        workflowId={workflow.id}
        draft={draft}
        published={published}
        isEditable={isEditable}
        onCreateDraft={() => workflowStore.createDraftRevision(workspaceSlug, projectId, workflow.id)}
        onPublish={() => workflowStore.publishRevision(workspaceSlug, projectId, workflow.id)}
      />

      {revision ? (
        <>
          <WorkflowStates
            revision={revision}
            projectStates={projectStates}
            isLoading={Boolean(isLoading)}
            isEditable={isRevisionEditable}
            onAdd={async (stateId) => {
              await workflowStore.addRevisionState(workspaceSlug, projectId, revision.id, { state_id: stateId });
            }}
            onToggleAllowNewWorkItems={async (workflowStateId, nextValue) => {
              await workflowStore.updateRevisionState(workspaceSlug, projectId, revision.id, workflowStateId, {
                allow_new_work_items: nextValue,
              });
            }}
            onRemove={(workflowStateId) =>
              workflowStore.removeRevisionState(workspaceSlug, projectId, revision.id, workflowStateId)
            }
          />

          <WorkflowTransitions
            states={revision.states}
            flows={revision.flows}
            getFlowActors={getFlowActors}
            isEditable={isRevisionEditable}
            onAddFlow={(sourceWorkflowStateId, targetWorkflowStateId) =>
              // §7.5 — the write API takes WorkflowState PKs, which is exactly
              // what the picker's options carry.
              workflowStore.addRevisionFlow(workspaceSlug, projectId, revision.id, {
                source_state_id: sourceWorkflowStateId,
                target_state_id: targetWorkflowStateId,
              })
            }
            onToggleFlowActive={(flowId, nextValue) =>
              workflowStore.updateRevisionFlow(workspaceSlug, projectId, revision.id, flowId, {
                is_active: nextValue,
              })
            }
            onAddActor={async (flowId, actorType) => {
              await workflowStore.addFlowActor(workspaceSlug, projectId, revision.id, flowId, {
                actor_type: actorType,
              });
            }}
            onRemoveActor={(flowId, actorId) =>
              workflowStore.removeFlowActor(workspaceSlug, projectId, revision.id, flowId, actorId)
            }
          />
        </>
      ) : (
        <p className="text-13 text-tertiary">
          {isEditable
            ? t("project_settings.workflows.revision.no_revision")
            : t("project_settings.workflows.transitions.read_only_notice")}
        </p>
      )}

      <WorkflowTypeAssignments
        workflow={workflow}
        projectAssignments={typeAssignments}
        isEditable={isEditable}
        onCreate={(workflowId, issueTypeId) =>
          workflowStore.createTypeAssignment(workspaceSlug, projectId, {
            workflow_id: workflowId,
            issue_type_id: issueTypeId,
          })
        }
        onRemove={(assignmentId) => workflowStore.removeTypeAssignment(workspaceSlug, projectId, assignmentId)}
      />
    </div>
  );
});
