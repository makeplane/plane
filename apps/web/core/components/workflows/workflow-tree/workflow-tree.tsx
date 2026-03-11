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
// hooks
import { useTranslation } from "@plane/i18n";
import { ApproverIcon, WorkflowIcon } from "@plane/propel/icons";
import { useMember } from "@/hooks/store/use-member";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUser } from "@/hooks/store/user";
import { useWorkflows } from "@/hooks/store/use-workflows";
import { useIssueTypes } from "@/plane-web/hooks/store";
// local imports
import { StatePill } from "./state-pill";
import { IssueTypeIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { getMemberLabel } from "./utils";

type Props = {
  parentStateId: string;
  typeId?: string | null;
};

export const WorkflowTree = observer(function WorkflowTree(props: Props) {
  const { parentStateId, typeId } = props;
  const { workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { data: user } = useUser();
  const { getStateById } = useProjectState();
  const { getWorkflowInfoTree, isApprovalsEnabled } = useWorkflows();
  const { getUserDetails } = useMember();
  const { getIssueTypeById } = useIssueTypes();
  // derived state
  const parentState = getStateById(parentStateId);
  const infoTree =
    workspaceSlug && parentState?.project_id
      ? getWorkflowInfoTree(workspaceSlug.toString(), parentState.project_id, parentStateId, typeId)
      : undefined;
  const approvalsEnabled =
    workspaceSlug && parentState?.project_id
      ? isApprovalsEnabled(workspaceSlug.toString(), parentState.project_id)
      : false;

  const getUserName = (memberId: string) => {
    if (memberId === user?.id) return t("common.you");
    return getUserDetails(memberId)?.display_name;
  };

  const allMembersLabel = t("entity.all", { entity: t("common.members") });

  if (!infoTree || infoTree.sections.length === 0) return <></>;

  return (
    <div className="flex flex-col gap-2 text-sm text-secondary">
      <div className="space-y-2">
        {infoTree.sections.map((section, index) => {
          const approvalMemberIds = Array.from(
            new Set(section.transitions.flatMap((transition) => transition.member_ids))
          );
          const isEpic = section.typeId ? Boolean(getIssueTypeById(section.typeId)?.is_epic) : false;
          const sectionKey =
            section.sectionKind === "default-workflow"
              ? "default-workflow"
              : (section.typeId ?? `type-scoped-${index}`);
          return (
            <div key={sectionKey} className="rounded-md border border-subtle overflow-hidden">
              {section.showTypeHeader && section.typeId && (
                <div className="flex items-center justify-between border-b border-subtle px-2.5 py-2 bg-layer-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 rounded-md p-1 border border-subtle">
                      <IssueTypeIdentifier issueTypeId={section.typeId} size="xs" />
                      <span className="text-caption-md-regular">{isEpic ? "Epic" : section.typeName}</span>
                    </div>
                    {!isEpic && <span className="text-caption-sm-regular text-secondary">work item type</span>}
                  </div>
                  {section.stateType === "approval" && approvalsEnabled ? (
                    <ApproverIcon className="size-4 text-secondary" />
                  ) : (
                    <WorkflowIcon className="size-4 text-secondary" />
                  )}
                </div>
              )}
              {section.sectionKind === "default-workflow" && (section.defaultWorkflowTypeIds?.length ?? 0) > 0 && (
                <div className="border-b border-subtle px-2.5 py-2 bg-layer-2 space-y-1.5">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1 items-start">
                      {section.defaultWorkflowTypeIds?.map((workflowTypeId) => {
                        const workflowType = getIssueTypeById(workflowTypeId);
                        if (!workflowType) return null;
                        return (
                          <div
                            key={workflowTypeId}
                            className="flex items-center gap-2 rounded-md p-1 border border-subtle"
                          >
                            <IssueTypeIdentifier issueTypeId={workflowTypeId} size="xs" />
                            <span className="text-caption-sm-regular text-secondary">{workflowType.name}</span>
                          </div>
                        );
                      })}
                    </div>
                    {section.stateType === "approval" && approvalsEnabled ? (
                      <ApproverIcon className="size-4 text-secondary" />
                    ) : (
                      <WorkflowIcon className="size-4 text-secondary" />
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2 px-2.5 py-2 text-base bg-layer-1">
                {!section.allowCreation && (
                  <p className="text-caption-sm-regular text-tertiary">
                    New work items cannot be created in this state.
                  </p>
                )}

                {section.stateType === "approval" ? (
                  <>
                    <p className="text-caption-sm-medium text-secondary">
                      Approver is {getMemberLabel(approvalMemberIds, getUserName, allMembersLabel)}.
                    </p>
                    {section.transitions.length === 0 ? (
                      <p className="text-caption-sm-regular text-tertiary">No transitions available from this state.</p>
                    ) : (
                      section.transitions.map((transition) => (
                        <div key={transition.id} className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-caption-sm-regular text-secondary">On approve, item moves to</span>
                            <StatePill stateId={transition.transition_state_id} />
                          </div>
                          {transition.rejection_state_id && (
                            <div className="flex items-center gap-1">
                              <span className="text-caption-sm-regular text-secondary">On reject, item moves to</span>
                              <StatePill stateId={transition.rejection_state_id} />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </>
                ) : (
                  <>
                    {section.transitions.length === 0 ? (
                      <p className="text-caption-sm-regular text-tertiary">No transitions available from this state.</p>
                    ) : (
                      section.transitions.map((transition) => (
                        <div
                          key={transition.id}
                          className="flex items-center gap-1 border-b border-subtle py-1 last:border-none"
                        >
                          <span className="text-caption-sm-medium text-secondary">
                            {getMemberLabel(transition.member_ids, getUserName, allMembersLabel)}{" "}
                            <span className="text-caption-sm-regular text-secondary">can move it to</span>
                          </span>
                          <StatePill stateId={transition.transition_state_id} />
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
