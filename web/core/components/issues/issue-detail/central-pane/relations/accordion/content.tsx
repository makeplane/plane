import { FC, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { TIssue, TIssueRelationIdMap } from "@plane/types";
import { Accordion, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { DeleteIssueModal } from "@/components/issues/delete-issue-modal";
import { CreateUpdateIssueModal } from "@/components/issues/issue-modal";
import { RelationIssueList } from "@/components/issues/relations";
// constants
import { ISSUE_DELETED, ISSUE_UPDATED } from "@/constants/event-tracker";
// helpers
import { copyTextToClipboard } from "@/helpers/string.helper";
// hooks
import { useEventTracker, useIssueDetail } from "@/hooks/store";
// helpers
import { ISSUE_RELATION_OPTIONS, TRelationIssueOperations } from "../helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

type TIssueCrudState = { toggle: boolean; issueId: string | undefined; issue: TIssue | undefined };

export const RelationsAccordionContent: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled = false } = props;
  // router
  const pathname = usePathname();
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
    updateIssue,
    removeIssue,
    toggleDeleteIssueModal,
    toggleCreateIssueModal,
  } = useIssueDetail();
  const { captureIssueEvent } = useEventTracker();

  // derived values
  const relations = getRelationsByIssueId(issueId);

  const issueOperations: TRelationIssueOperations = useMemo(
    () => ({
      copyText: (text: string) => {
        const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
        copyTextToClipboard(`${originURL}/${text}`).then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Link Copied!",
            message: "Issue link copied to clipboard.",
          });
        });
      },
      update: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
        try {
          await updateIssue(workspaceSlug, projectId, issueId, data);
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { ...data, issueId, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: Object.keys(data).join(","),
              change_details: Object.values(data).join(","),
            },
            path: pathname,
          });
        } catch (error) {
          captureIssueEvent({
            eventName: ISSUE_UPDATED,
            payload: { state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: Object.keys(data).join(","),
              change_details: Object.values(data).join(","),
            },
            path: pathname,
          });
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Issue update failed",
          });
        }
      },
      remove: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await removeIssue(workspaceSlug, projectId, issueId);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Issue deleted successfully",
          });
          captureIssueEvent({
            eventName: ISSUE_DELETED,
            payload: { id: issueId, state: "SUCCESS", element: "Issue detail page" },
            path: pathname,
          });
        } catch (error) {
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Issue delete failed",
          });
          captureIssueEvent({
            eventName: ISSUE_DELETED,
            payload: { id: issueId, state: "FAILED", element: "Issue detail page" },
            path: pathname,
          });
        }
      },
    }),
    [pathname, removeIssue, updateIssue]
  );

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

  return (
    <>
      <div className="flex flex-col gap-">
        {filteredRelationsArray.map((relation) => (
          <div key={relation.relationKey}>
            <Accordion
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
            </Accordion>
          </div>
        ))}
      </div>

      {issueCrudState?.delete?.toggle &&
        issueCrudState?.delete?.issue &&
        issueCrudState.delete.issueId &&
        issueCrudState.delete.issue.id && (
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
            isSubIssue
          />
        )}

      {issueCrudState?.update?.toggle && issueCrudState?.update?.issue && (
        <>
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
        </>
      )}
    </>
  );
});
