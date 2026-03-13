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

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TIssue, TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
// components
import { CreateUpdateIssueModal } from "@/components/issues/issue-modal/root";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// Plane-web
import { CreateUpdateEpicModal } from "@/components/epics/epic-modal";
import { useDependencyOptions } from "@/components/relations";
import type { TIssueRelationTypes } from "@/types";
// helper
import { DeleteIssueModal } from "../../delete-issue-modal";
import { RelationIssueList } from "../../relations/issue-list";
import { useRelationOperations } from "../relations/helper";

type Props = {
  workspaceSlug: string;
  issueId: string;
  disabled: boolean;
  issueServiceType?: TIssueServiceType;
};

type TIssueCrudState = { toggle: boolean; issueId: string | undefined; issue: TIssue | undefined };

export const DependenciesCollapsibleContent = observer(function DependenciesCollapsibleContent(props: Props) {
  const { workspaceSlug, issueId, disabled = false, issueServiceType = EIssueServiceType.ISSUES } = props;
  // plane hooks
  const { t } = useTranslation();
  // state
  const [issueCrudState, setIssueCrudState] = useState<{
    update: TIssueCrudState;
    delete: TIssueCrudState;
    removeRelation: TIssueCrudState & { relationKey: string | undefined; relationIssueId: string | undefined };
  }>({
    update: {
      toggle: false,
      issueId: undefined,
      issue: undefined,
    },
    delete: {
      toggle: false,
      issueId: undefined,
      issue: undefined,
    },
    removeRelation: {
      toggle: false,
      issueId: undefined,
      issue: undefined,
      relationKey: undefined,
      relationIssueId: undefined,
    },
  });

  // store hooks
  const {
    relation: { getRelationsByIssueId, removeRelation },
    toggleDeleteIssueModal,
    toggleCreateIssueModal,
  } = useIssueDetail(issueServiceType);

  // helper
  const issueOperations = useRelationOperations();
  const epicOperations = useRelationOperations(EIssueServiceType.EPICS);

  // derived values
  const relations = getRelationsByIssueId(issueId);
  const DEPENDENCY_OPTIONS = useDependencyOptions();

  const handleIssueCrudState = (
    key: "update" | "delete" | "removeRelation",
    _issueId: string | null,
    issue: TIssue | null = null,
    relationKey?: string | null,
    relationIssueId?: string | null
  ) => {
    setIssueCrudState((prevState) => ({
      ...prevState,
      [key]: {
        toggle: !prevState[key].toggle,
        issueId: _issueId,
        issue: issue,
        relationKey: relationKey,
        relationIssueId: relationIssueId,
      },
    }));
  };

  // if relations are not available, return null
  if (!relations) return null;

  // map relations to array
  const relationsArray = (Object.keys(relations) as TIssueRelationTypes[])
    .filter((relationKey) => !!DEPENDENCY_OPTIONS[relationKey])
    .map((relationKey) => {
      const issueIds = relations[relationKey];
      const option = DEPENDENCY_OPTIONS[relationKey];
      return {
        relationKey: relationKey,
        issueIds: issueIds,
        icon: option?.icon,
        label: option?.rawLabel ?? (option?.i18n_label ? t(option.i18n_label) : ""),
        className: option?.className,
      };
    });

  // filter out relations with no issues
  const filteredRelationsArray = relationsArray.filter((relation) => relation.issueIds.length > 0);

  const shouldRenderIssueDeleteModal =
    issueCrudState?.delete?.toggle &&
    issueCrudState?.delete?.issue &&
    issueCrudState.delete.issueId &&
    issueCrudState.delete.issue.id;

  const shouldRenderIssueUpdateModal = issueCrudState?.update?.toggle && issueCrudState?.update?.issue;

  return (
    <>
      <div className="flex flex-col">
        {filteredRelationsArray.map((relation) => (
          <div key={relation.relationKey}>
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="w-full">
                <div className={`flex items-center gap-1 px-2.5 py-1 h-9  w-full ${relation.className}`}>
                  <span>{relation.icon ? relation.icon(14) : null}</span>
                  <span className="text-13 font-medium leading-5">{relation.label}</span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <RelationIssueList
                  workspaceSlug={workspaceSlug}
                  issueId={issueId}
                  relationKey={relation.relationKey}
                  issueIds={relation.issueIds}
                  disabled={disabled}
                  handleIssueCrudState={handleIssueCrudState}
                  issueServiceType={issueServiceType}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>
        ))}
      </div>

      {shouldRenderIssueDeleteModal && (
        <DeleteIssueModal
          isOpen={issueCrudState?.delete?.toggle}
          handleClose={() => {
            handleIssueCrudState("delete", null, null);
            toggleDeleteIssueModal(null);
          }}
          data={issueCrudState?.delete?.issue as TIssue}
          onSubmit={async () => {
            if (
              issueCrudState.removeRelation.issueId &&
              issueCrudState.removeRelation.issue?.project_id &&
              issueCrudState.removeRelation.relationKey &&
              issueCrudState.removeRelation.relationIssueId
            ) {
              await removeRelation(
                workspaceSlug,
                issueCrudState.removeRelation.issue.project_id,
                issueCrudState.removeRelation.issueId,
                issueCrudState.removeRelation.relationKey,
                issueCrudState.removeRelation.relationIssueId,
                true
              );
            }
            if (
              issueCrudState.delete.issue &&
              issueCrudState.delete.issue.id &&
              issueCrudState.delete.issue.project_id
            ) {
              const deleteOperation = issueCrudState.delete.issue?.is_epic
                ? epicOperations.remove
                : issueOperations.remove;
              await deleteOperation(
                workspaceSlug,
                issueCrudState.delete.issue?.project_id,
                issueCrudState?.delete?.issue?.id
              );
            }
          }}
          isEpic={!!issueCrudState.delete.issue?.is_epic}
        />
      )}

      {shouldRenderIssueUpdateModal && (
        <>
          {issueCrudState?.update?.issue?.is_epic ? (
            <CreateUpdateEpicModal
              isOpen={issueCrudState?.update?.toggle}
              onClose={() => {
                handleIssueCrudState("update", null, null);
                toggleCreateIssueModal(false);
              }}
              data={issueCrudState?.update?.issue ?? undefined}
              onSubmit={async (_issue: TIssue) => {
                if (!_issue.id || !_issue.project_id) return;
                await epicOperations.update(workspaceSlug, _issue.project_id, _issue.id, _issue);
              }}
            />
          ) : (
            <CreateUpdateIssueModal
              isOpen={issueCrudState?.update?.toggle}
              onClose={() => {
                handleIssueCrudState("update", null, null);
                toggleCreateIssueModal(false);
              }}
              data={issueCrudState?.update?.issue ?? undefined}
              onSubmit={async (_issue: TIssue) => {
                if (!_issue.id || !_issue.project_id) return;
                await issueOperations.update(workspaceSlug, _issue.project_id, _issue.id, _issue);
              }}
            />
          )}
        </>
      )}
    </>
  );
});
