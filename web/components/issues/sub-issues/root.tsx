import { FC, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Plus, ChevronRight, ChevronDown, Loader } from "lucide-react";
// hooks
import { useIssueDetail } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { ExistingIssuesListModal } from "components/core";
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
import { IssueList } from "./issues-list";
import { ProgressBar } from "./progressbar";
// ui
import { CustomMenu } from "@plane/ui";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import { IUser, TIssue } from "@plane/types";

export interface ISubIssuesRoot {
  workspaceSlug: string;
  projectId: string;
  parentIssueId: string;
  currentUser: IUser;
  disabled: boolean;
}

export type TSubIssueOperations = {
  copyText: (text: string) => void;
  fetchSubIssues: (workspaceSlug: string, projectId: string, parentIssueId: string) => Promise<void>;
  addSubIssue: (workspaceSlug: string, projectId: string, parentIssueId: string, issueIds: string[]) => Promise<void>;
  updateSubIssue: (
    workspaceSlug: string,
    projectId: string,
    parentIssueId: string,
    issueId: string,
    issueData: Partial<TIssue>,
    oldIssue?: Partial<TIssue>,
    fromModal?: boolean
  ) => Promise<void>;
  removeSubIssue: (workspaceSlug: string, projectId: string, parentIssueId: string, issueId: string) => Promise<void>;
  deleteSubIssue: (workspaceSlug: string, projectId: string, parentIssueId: string, issueId: string) => Promise<void>;
};

export const SubIssuesRoot: FC<ISubIssuesRoot> = observer((props) => {
  const { workspaceSlug, projectId, parentIssueId, disabled = false } = props;
  // store hooks
  const { setToastAlert } = useToast();
  const {
    issue: { getIssueById },
    subIssues: { subIssuesByIssueId, stateDistributionByIssueId, subIssueHelpersByIssueId, setSubIssueHelpers },
    fetchSubIssues,
    createSubIssues,
    updateSubIssue,
    removeSubIssue,
    deleteSubIssue,
  } = useIssueDetail();
  // state

  type TIssueCrudState = { toggle: boolean; parentIssueId: string | undefined; issue: TIssue | undefined };
  const [issueCrudState, setIssueCrudState] = useState<{
    create: TIssueCrudState;
    existing: TIssueCrudState;
    update: TIssueCrudState;
    delete: TIssueCrudState;
  }>({
    create: {
      toggle: false,
      parentIssueId: undefined,
      issue: undefined,
    },
    existing: {
      toggle: false,
      parentIssueId: undefined,
      issue: undefined,
    },
    update: {
      toggle: false,
      parentIssueId: undefined,
      issue: undefined,
    },
    delete: {
      toggle: false,
      parentIssueId: undefined,
      issue: undefined,
    },
  });

  const handleIssueCrudState = (
    key: "create" | "existing" | "update" | "delete",
    _parentIssueId: string | null,
    issue: TIssue | null = null
  ) => {
    setIssueCrudState({
      ...issueCrudState,
      [key]: {
        toggle: !issueCrudState[key].toggle,
        parentIssueId: _parentIssueId,
        issue: issue,
      },
    });
  };

  const subIssueOperations: TSubIssueOperations = useMemo(
    () => ({
      copyText: (text: string) => {
        const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
        copyTextToClipboard(`${originURL}/${text}`).then(() => {
          setToastAlert({
            type: "success",
            title: "Link Copied!",
            message: "Issue link copied to clipboard.",
          });
        });
      },
      fetchSubIssues: async (workspaceSlug: string, projectId: string, parentIssueId: string) => {
        try {
          await fetchSubIssues(workspaceSlug, projectId, parentIssueId);
        } catch (error) {
          setToastAlert({
            type: "error",
            title: "Error fetching sub-issues",
            message: "Error fetching sub-issues",
          });
        }
      },
      addSubIssue: async (workspaceSlug: string, projectId: string, parentIssueId: string, issueIds: string[]) => {
        try {
          await createSubIssues(workspaceSlug, projectId, parentIssueId, issueIds);
          setToastAlert({
            type: "success",
            title: "Sub-issues added successfully",
            message: "Sub-issues added successfully",
          });
        } catch (error) {
          setToastAlert({
            type: "error",
            title: "Error adding sub-issue",
            message: "Error adding sub-issue",
          });
        }
      },
      updateSubIssue: async (
        workspaceSlug: string,
        projectId: string,
        parentIssueId: string,
        issueId: string,
        issueData: Partial<TIssue>,
        oldIssue: Partial<TIssue> = {},
        fromModal: boolean = false
      ) => {
        try {
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
          await updateSubIssue(workspaceSlug, projectId, parentIssueId, issueId, issueData, oldIssue, fromModal);
          setToastAlert({
            type: "success",
            title: "Sub-issue updated successfully",
            message: "Sub-issue updated successfully",
          });
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
        } catch (error) {
          setToastAlert({
            type: "error",
            title: "Error updating sub-issue",
            message: "Error updating sub-issue",
          });
        }
      },
      removeSubIssue: async (workspaceSlug: string, projectId: string, parentIssueId: string, issueId: string) => {
        try {
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
          await removeSubIssue(workspaceSlug, projectId, parentIssueId, issueId);
          setToastAlert({
            type: "success",
            title: "Sub-issue removed successfully",
            message: "Sub-issue removed successfully",
          });
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
        } catch (error) {
          setToastAlert({
            type: "error",
            title: "Error removing sub-issue",
            message: "Error removing sub-issue",
          });
        }
      },
      deleteSubIssue: async (workspaceSlug: string, projectId: string, parentIssueId: string, issueId: string) => {
        try {
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
          await deleteSubIssue(workspaceSlug, projectId, parentIssueId, issueId);
          setToastAlert({
            type: "success",
            title: "Issue deleted successfully",
            message: "Issue deleted successfully",
          });
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
        } catch (error) {
          setToastAlert({
            type: "error",
            title: "Error deleting issue",
            message: "Error deleting issue",
          });
        }
      },
    }),
    [fetchSubIssues, createSubIssues, updateSubIssue, removeSubIssue, deleteSubIssue, setToastAlert, setSubIssueHelpers]
  );

  const issue = getIssueById(parentIssueId);
  const subIssuesDistribution = stateDistributionByIssueId(parentIssueId);
  const subIssues = subIssuesByIssueId(parentIssueId);
  const subIssueHelpers = subIssueHelpersByIssueId(`${parentIssueId}_root`);

  if (!issue) return <></>;
  return (
    <div className="h-full w-full space-y-2">
      {!subIssues ? (
        <div className="py-3 text-center text-sm  font-medium text-custom-text-300">Loading...</div>
      ) : (
        <>
          {subIssues && subIssues?.length > 0 ? (
            <>
              <div className="relative flex items-center gap-4 text-xs">
                <div
                  className="flex cursor-pointer select-none items-center gap-1 rounded border border-custom-border-100 p-1.5 px-2 shadow transition-all hover:bg-custom-background-80"
                  onClick={async () => {
                    if (!subIssueHelpers.issue_visibility.includes(parentIssueId)) {
                      setSubIssueHelpers(`${parentIssueId}_root`, "preview_loader", parentIssueId);
                      await subIssueOperations.fetchSubIssues(workspaceSlug, projectId, parentIssueId);
                      setSubIssueHelpers(`${parentIssueId}_root`, "preview_loader", parentIssueId);
                    }
                    setSubIssueHelpers(`${parentIssueId}_root`, "issue_visibility", parentIssueId);
                  }}
                >
                  <div className="flex h-[16px] w-[16px] flex-shrink-0 items-center justify-center">
                    {subIssueHelpers.preview_loader.includes(parentIssueId) ? (
                      <Loader width={14} strokeWidth={2} className="animate-spin" />
                    ) : subIssueHelpers.issue_visibility.includes(parentIssueId) ? (
                      <ChevronDown width={16} strokeWidth={2} />
                    ) : (
                      <ChevronRight width={14} strokeWidth={2} />
                    )}
                  </div>
                  <div>Sub-issues</div>
                  <div>({subIssues?.length || 0})</div>
                </div>

                <div className="w-full max-w-[250px] select-none">
                  <ProgressBar
                    total={subIssues?.length || 0}
                    done={
                      ((subIssuesDistribution?.cancelled ?? []).length || 0) +
                      ((subIssuesDistribution?.completed ?? []).length || 0)
                    }
                  />
                </div>

                {!disabled && (
                  <div className="ml-auto flex flex-shrink-0 select-none items-center gap-2">
                    <div
                      className="cursor-pointer rounded border border-custom-border-100 p-1.5 px-2 shadow transition-all hover:bg-custom-background-80"
                      onClick={() => handleIssueCrudState("create", parentIssueId, null)}
                    >
                      Add sub-issue
                    </div>
                    <div
                      className="cursor-pointer rounded border border-custom-border-100 p-1.5 px-2 shadow transition-all hover:bg-custom-background-80"
                      onClick={() => handleIssueCrudState("existing", parentIssueId, null)}
                    >
                      Add an existing issue
                    </div>
                  </div>
                )}
              </div>

              {subIssueHelpers.issue_visibility.includes(parentIssueId) && (
                <div className="border border-b-0 border-custom-border-100">
                  <IssueList
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    parentIssueId={parentIssueId}
                    spacingLeft={10}
                    disabled={!disabled}
                    handleIssueCrudState={handleIssueCrudState}
                    subIssueOperations={subIssueOperations}
                  />
                </div>
              )}

              <div>
                <CustomMenu
                  label={
                    <div className="flex items-center gap-1">
                      <Plus className="h-3 w-3" />
                      Add sub-issue
                    </div>
                  }
                  buttonClassName="whitespace-nowrap"
                  placement="bottom-end"
                  noBorder
                  noChevron
                >
                  <CustomMenu.MenuItem
                    onClick={() => {
                      handleIssueCrudState("create", parentIssueId, null);
                    }}
                  >
                    Create new
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem
                    onClick={() => {
                      handleIssueCrudState("existing", parentIssueId, null);
                    }}
                  >
                    Add an existing issue
                  </CustomMenu.MenuItem>
                </CustomMenu>
              </div>
            </>
          ) : (
            !disabled && (
              <div className="flex items-center justify-between">
                <div className="py-2 text-xs italic text-custom-text-300">No Sub-Issues yet</div>
                <div>
                  <CustomMenu
                    label={
                      <>
                        <Plus className="h-3 w-3" />
                        Add sub-issue
                      </>
                    }
                    buttonClassName="whitespace-nowrap"
                    placement="bottom-end"
                    noBorder
                    noChevron
                  >
                    <CustomMenu.MenuItem
                      onClick={() => {
                        handleIssueCrudState("create", parentIssueId, null);
                      }}
                    >
                      Create new
                    </CustomMenu.MenuItem>
                    <CustomMenu.MenuItem
                      onClick={() => {
                        handleIssueCrudState("existing", parentIssueId, null);
                      }}
                    >
                      Add an existing issue
                    </CustomMenu.MenuItem>
                  </CustomMenu>
                </div>
              </div>
            )
          )}

          {/* issue create, add from existing , update and delete modals */}
          {issueCrudState?.create?.toggle && issueCrudState?.create?.parentIssueId && (
            <CreateUpdateIssueModal
              isOpen={issueCrudState?.create?.toggle}
              data={{
                parent_id: issueCrudState?.create?.parentIssueId,
              }}
              onClose={() => handleIssueCrudState("create", null, null)}
              onSubmit={async (_issue: TIssue) => {
                await subIssueOperations.addSubIssue(workspaceSlug, projectId, parentIssueId, [_issue.id]);
              }}
            />
          )}

          {issueCrudState?.existing?.toggle && issueCrudState?.existing?.parentIssueId && (
            <ExistingIssuesListModal
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              isOpen={issueCrudState?.existing?.toggle}
              handleClose={() => handleIssueCrudState("existing", null, null)}
              searchParams={{ sub_issue: true, issue_id: issueCrudState?.existing?.parentIssueId }}
              handleOnSubmit={(_issue) =>
                subIssueOperations.addSubIssue(
                  workspaceSlug,
                  projectId,
                  parentIssueId,
                  _issue.map((issue) => issue.id)
                )
              }
              workspaceLevelToggle
            />
          )}

          {issueCrudState?.update?.toggle && issueCrudState?.update?.issue && (
            <>
              <CreateUpdateIssueModal
                isOpen={issueCrudState?.update?.toggle}
                onClose={() => {
                  handleIssueCrudState("update", null, null);
                }}
                data={issueCrudState?.update?.issue ?? undefined}
                onSubmit={async (_issue: TIssue) => {
                  await subIssueOperations.updateSubIssue(
                    workspaceSlug,
                    projectId,
                    parentIssueId,
                    _issue.id,
                    _issue,
                    issueCrudState?.update?.issue,
                    true
                  );
                }}
              />
            </>
          )}

          {issueCrudState?.delete?.toggle &&
            issueCrudState?.delete?.issue &&
            issueCrudState.delete.parentIssueId &&
            issueCrudState.delete.issue.id && (
              <DeleteIssueModal
                isOpen={issueCrudState?.delete?.toggle}
                handleClose={() => {
                  handleIssueCrudState("delete", null, null);
                }}
                data={issueCrudState?.delete?.issue as TIssue}
                onSubmit={async () =>
                  await subIssueOperations.deleteSubIssue(
                    workspaceSlug,
                    projectId,
                    issueCrudState?.delete?.parentIssueId as string,
                    issueCrudState?.delete?.issue?.id as string
                  )
                }
              />
            )}
        </>
      )}
    </div>
  );
});
