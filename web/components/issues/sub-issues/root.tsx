import React, { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Plus, ChevronRight, ChevronDown } from "lucide-react";
// hooks
import { useIssueDetail, useIssues, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { ExistingIssuesListModal } from "components/core";
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
import { SubIssuesRootList } from "./issues-list";
import { ProgressBar } from "./progressbar";
// ui
import { CustomMenu } from "@plane/ui";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import { IUser, TIssue, ISearchIssueResponse } from "@plane/types";
// services
import { IssueService } from "services/issue";
// fetch keys
import { SUB_ISSUES } from "constants/fetch-keys";
// constants
import { EUserProjectRoles } from "constants/project";
import { EIssuesStoreType } from "constants/issue";

export interface ISubIssuesRoot {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  currentUser: IUser;
  is_archived: boolean;
  is_editable: boolean;
}

export const SubIssuesRoot: React.FC<ISubIssuesRoot> = observer((props) => {
  const { workspaceSlug, projectId, issueId, currentUser, is_archived, is_editable } = props;
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { setToastAlert } = useToast();
  const {
    subIssues: { subIssuesByIssueId, subIssuesStateDistribution },
    updateIssue,
    removeIssue,
    fetchSubIssues,
    createSubIssues,
  } = useIssueDetail();
  // state
  const [currentIssue, setCurrentIssue] = useState<TIssue>();

  console.log("subIssuesByIssueId", subIssuesByIssueId(issueId));

  const copyText = (text: string) => {
    const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    copyTextToClipboard(`${originURL}/${text}`).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Issue link copied to clipboard.",
      });
    });
  };

  const subIssueOperations = useMemo(
    () => ({
      fetchSubIssues: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await fetchSubIssues(workspaceSlug, projectId, issueId);
        } catch (error) {}
      },
      update: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
        try {
          await updateIssue(workspaceSlug, projectId, issueId, data);
          setToastAlert({
            title: "Issue updated successfully",
            type: "success",
            message: "Issue updated successfully",
          });
        } catch (error) {
          setToastAlert({
            title: "Issue update failed",
            type: "error",
            message: "Issue update failed",
          });
        }
      },
      addSubIssue: async () => {
        try {
        } catch (error) {}
      },
      removeSubIssue: async () => {
        try {
        } catch (error) {}
      },
      updateIssue: async () => {
        try {
        } catch (error) {}
      },
      deleteIssue: async () => {
        try {
        } catch (error) {}
      },
    }),
    []
  );

  const [issueCrudOperation, setIssueCrudOperation] = React.useState<{
    // type: "create" | "edit";
    create: { toggle: boolean; issueId: string | null };
    existing: { toggle: boolean; issueId: string | null };
  }>({
    create: {
      toggle: false,
      issueId: null,
    },
    existing: {
      toggle: false,
      issueId: null,
    },
  });

  const handleIssueCrudOperation = (
    key: "create" | "existing",
    issueId: string | null,
    issue: TIssue | null = null
  ) => {
    setIssueCrudOperation({
      ...issueCrudOperation,
      [key]: {
        toggle: !issueCrudOperation[key].toggle,
        issueId: issueId,
        issue: issue,
      },
    });
  };

  return (
    <div className="h-full w-full space-y-2">
      {/* {!issues && isLoading ? (
        <div className="py-3 text-center text-sm  font-medium text-custom-text-300">Loading...</div>
      ) : (
        <>
          {issues && issues?.sub_issues && issues?.sub_issues?.length > 0 ? (
            <>
              <div className="relative flex items-center gap-4 text-xs">
                <div
                  className="flex cursor-pointer select-none items-center gap-1 rounded border border-custom-border-100 p-1.5 px-2 shadow transition-all hover:bg-custom-background-80"
                  onClick={() => handleIssuesLoader({ key: "visibility", issueId: parentIssue?.id })}
                >
                  <div className="flex h-[16px] w-[16px] flex-shrink-0 items-center justify-center">
                    {issuesLoader.visibility.includes(parentIssue?.id) ? (
                      <ChevronDown width={16} strokeWidth={2} />
                    ) : (
                      <ChevronRight width={14} strokeWidth={2} />
                    )}
                  </div>
                  <div>Sub-issues</div>
                  <div>({issues?.sub_issues?.length || 0})</div>
                </div>

                <div className="w-full max-w-[250px] select-none">
                  <ProgressBar
                    total={issues?.sub_issues?.length || 0}
                    done={(issues?.state_distribution?.cancelled || 0) + (issues?.state_distribution?.completed || 0)}
                  />
                </div>

                {is_editable && issuesLoader.visibility.includes(parentIssue?.id) && (
                  <div className="ml-auto flex flex-shrink-0 select-none items-center gap-2">
                    <div
                      className="cursor-pointer rounded border border-custom-border-100 p-1.5 px-2 shadow transition-all hover:bg-custom-background-80"
                      onClick={() => handleIssueCrudOperation("create", parentIssue?.id)}
                    >
                      Add sub-issue
                    </div>
                    <div
                      className="cursor-pointer rounded border border-custom-border-100 p-1.5 px-2 shadow transition-all hover:bg-custom-background-80"
                      onClick={() => handleIssueCrudOperation("existing", parentIssue?.id)}
                    >
                      Add an existing issue
                    </div>
                  </div>
                )}
              </div>


              {issuesLoader.visibility.includes(parentIssue?.id) && workspaceSlug && projectId && (
                <div className="border border-b-0 border-custom-border-100">
                  <SubIssuesRootList
                    workspaceSlug={workspaceSlug.toString()}
                    projectId={projectId.toString()}
                    parentIssue={parentIssue}
                    user={undefined}
                    editable={is_editable}
                    removeIssueFromSubIssues={removeIssueFromSubIssues}
                    issuesLoader={issuesLoader}
                    handleIssuesLoader={handleIssuesLoader}
                    copyText={copyText}
                    handleIssueCrudOperation={handleIssueCrudOperation}
                    handleUpdateIssue={handleUpdateIssue}
                  />
                </div>
              )}

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
                      handleIssueCrudOperation("create", parentIssue?.id);
                    }}
                  >
                    Create new
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem
                    onClick={() => {
                      handleIssueCrudOperation("existing", parentIssue?.id);
                    }}
                  >
                    Add an existing issue
                  </CustomMenu.MenuItem>
                </CustomMenu>
              </div>
            </>
          ) : (
            is_editable && (
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
                        handleIssueCrudOperation("create", parentIssue?.id);
                      }}
                    >
                      Create new
                    </CustomMenu.MenuItem>
                    <CustomMenu.MenuItem
                      onClick={() => {
                        handleIssueCrudOperation("existing", parentIssue?.id);
                      }}
                    >
                      Add an existing issue
                    </CustomMenu.MenuItem>
                  </CustomMenu>
                </div>
              </div>
            )
          )}

          {is_editable && issueCrudOperation?.create?.toggle && (
            <CreateUpdateIssueModal
              isOpen={issueCrudOperation?.create?.toggle}
              data={{
                parent_id: issueCrudOperation?.create?.issueId,
              }}
              onClose={() => {
                handleIssueCrudOperation("create", null);
              }}
            />
          )}

          {is_editable && issueCrudOperation?.existing?.toggle && issueCrudOperation?.existing?.issueId && (
            <ExistingIssuesListModal
              isOpen={issueCrudOperation?.existing?.toggle}
              handleClose={() => handleIssueCrudOperation("existing", null)}
              searchParams={{ sub_issue: true, issue_id: issueCrudOperation?.existing?.issueId }}
              handleOnSubmit={addAsSubIssueFromExistingIssues}
              workspaceLevelToggle
            />
          )}

          {is_editable && issueCrudOperation?.edit?.toggle && issueCrudOperation?.edit?.issueId && (
            <>
              <CreateUpdateIssueModal
                isOpen={issueCrudOperation?.edit?.toggle}
                onClose={() => {
                  handleIssueCrudOperation("edit", null, null);
                }}
                data={issueCrudOperation?.edit?.issue ?? undefined}
              />
            </>
          )}

          {is_editable &&
            workspaceSlug &&
            projectId &&
            issueCrudOperation?.delete?.issueId &&
            issueCrudOperation?.delete?.issue && (
              <DeleteIssueModal
                isOpen={issueCrudOperation?.delete?.toggle}
                handleClose={() => {
                  handleIssueCrudOperation("delete", null, null);
                }}
                data={issueCrudOperation?.delete?.issue}
                onSubmit={async () => {
                  await removeIssue(
                    workspaceSlug.toString(),
                    projectId.toString(),
                    issueCrudOperation?.delete?.issue?.id ?? ""
                  );
                }}
              />
            )}
        </>
      )} */}
    </div>
  );
});
