"use client";
import { FC, useState } from "react";
import { observer } from "mobx-react";
import { CircleDot, CopyPlus, XCircle } from "lucide-react";
import { TIssue, TIssueRelationIdMap } from "@plane/types";
import { Collapsible, RelatedIcon } from "@plane/ui";
// components
import { RelationIssueList } from "@/components/issues";
import { DeleteIssueModal } from "@/components/issues/delete-issue-modal";
import { CreateUpdateIssueModal } from "@/components/issues/issue-modal";
// hooks
import { useIssueDetail } from "@/hooks/store";
// helper
import { useRelationOperations } from "./helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

const ISSUE_RELATION_OPTIONS = [
  {
    key: "blocked_by",
    label: "Blocked by",
    icon: (size: number) => <CircleDot size={size} />,
    className: "bg-red-500/20 text-red-700",
  },
  {
    key: "blocking",
    label: "Blocking",
    icon: (size: number) => <XCircle size={size} />,
    className: "bg-yellow-500/20 text-yellow-700",
  },
  {
    key: "relates_to",
    label: "Relates to",
    icon: (size: number) => <RelatedIcon height={size} width={size} />,
    className: "bg-custom-background-80 text-custom-text-200",
  },
  {
    key: "duplicate",
    label: "Duplicate of",
    icon: (size: number) => <CopyPlus size={size} />,
    className: "bg-custom-background-80 text-custom-text-200",
  },
];

type TIssueCrudState = { toggle: boolean; issueId: string | undefined; issue: TIssue | undefined };

export const RelationsCollapsibleContent: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled = false } = props;
  // state
  const [issueCrudState, setIssueCrudState] = useState<{
    update: TIssueCrudState;
    delete: TIssueCrudState;
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
  });

  // store hooks
  const {
    relation: { getRelationsByIssueId },
    toggleDeleteIssueModal,
    toggleCreateIssueModal,
  } = useIssueDetail();

  // helper
  const issueOperations = useRelationOperations();

  // derived values
  const relations = getRelationsByIssueId(issueId);

  const handleIssueCrudState = (key: "update" | "delete", _issueId: string | null, issue: TIssue | null = null) => {
    setIssueCrudState({
      ...issueCrudState,
      [key]: {
        toggle: !issueCrudState[key].toggle,
        issueId: _issueId,
        issue: issue,
      },
    });
  };

  // if relations are not available, return null
  if (!relations) return null;

  // map relations to array
  const relationsArray = Object.keys(relations).map((relationKey) => {
    const issueIds = relations[relationKey as keyof TIssueRelationIdMap];
    const issueRelationOption = ISSUE_RELATION_OPTIONS.find((option) => option.key === relationKey);
    return {
      relationKey: relationKey as keyof TIssueRelationIdMap,
      issueIds: issueIds,
      icon: issueRelationOption?.icon,
      label: issueRelationOption?.label,
      className: issueRelationOption?.className,
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
      <div className="flex flex-col gap-">
        {filteredRelationsArray.map((relation) => (
          <div key={relation.relationKey}>
            <Collapsible
              buttonClassName="w-full"
              title={
                <div className={`flex items-center gap-1 px-3 py-1 h-9  w-full pl-9 ${relation.className}`}>
                  <span>{relation.icon ? relation.icon(14) : null}</span>
                  <span className="text-sm font-medium leading-5">{relation.label}</span>
                </div>
              }
              defaultOpen
            >
              <RelationIssueList
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                relationKey={relation.relationKey}
                issueIds={relation.issueIds}
                disabled={disabled}
                issueOperations={issueOperations}
                handleIssueCrudState={handleIssueCrudState}
              />
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
          onSubmit={async () =>
            await issueOperations.remove(workspaceSlug, projectId, issueCrudState?.delete?.issue?.id as string)
          }
        />
      )}

      {shouldRenderIssueUpdateModal && (
        <CreateUpdateIssueModal
          isOpen={issueCrudState?.update?.toggle}
          onClose={() => {
            handleIssueCrudState("update", null, null);
            toggleCreateIssueModal(false);
          }}
          data={issueCrudState?.update?.issue ?? undefined}
          onSubmit={async (_issue: TIssue) => {
            await issueOperations.update(workspaceSlug, projectId, _issue.id, _issue);
          }}
        />
      )}
    </>
  );
});
