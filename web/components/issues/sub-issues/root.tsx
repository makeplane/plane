import React from "react";
// next imports
import { useRouter } from "next/router";
// swr
import useSWR, { mutate } from "swr";
// lucide icons
import { Plus, ChevronRight, ChevronDown } from "lucide-react";
// components
import { ExistingIssuesListModal } from "components/core";
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
import { SubIssuesRootList } from "./issues-list";
import { ProgressBar } from "./progressbar";
// ui
import { CustomMenu } from "components/ui";
// hooks
import { useProjectMyMembership } from "contexts/project-member.context";
import useToast from "hooks/use-toast";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import { IUser, IIssue, ISearchIssueResponse } from "types";
// services
import { IssueService } from "services/issue";
// fetch keys
import { SUB_ISSUES } from "constants/fetch-keys";

export interface ISubIssuesRoot {
  parentIssue: IIssue;
  user: IUser | undefined;
}

export interface ISubIssuesRootLoaders {
  visibility: string[];
  delete: string[];
  sub_issues: string[];
}
export interface ISubIssuesRootLoadersHandler {
  key: "visibility" | "delete" | "sub_issues";
  issueId: string;
}

const issueService = new IssueService();

export const SubIssuesRoot: React.FC<ISubIssuesRoot> = ({ parentIssue, user }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    peekIssue: string;
  };

  const { memberRole } = useProjectMyMembership();
  const { setToastAlert } = useToast();

  const { data: issues, isLoading } = useSWR(
    workspaceSlug && projectId && parentIssue && parentIssue?.id ? SUB_ISSUES(parentIssue?.id) : null,
    workspaceSlug && projectId && parentIssue && parentIssue?.id
      ? () => issueService.subIssues(workspaceSlug, projectId, parentIssue.id)
      : null
  );

  const [issuesLoader, setIssuesLoader] = React.useState<ISubIssuesRootLoaders>({
    visibility: [parentIssue?.id],
    delete: [],
    sub_issues: [],
  });
  const handleIssuesLoader = ({ key, issueId }: ISubIssuesRootLoadersHandler) => {
    setIssuesLoader((previousData: ISubIssuesRootLoaders) => ({
      ...previousData,
      [key]: previousData[key].includes(issueId)
        ? previousData[key].filter((i: string) => i !== issueId)
        : [...previousData[key], issueId],
    }));
  };

  const [issueCrudOperation, setIssueCrudOperation] = React.useState<{
    create: { toggle: boolean; issueId: string | null };
    existing: { toggle: boolean; issueId: string | null };
    edit: { toggle: boolean; issueId: string | null; issue: IIssue | null };
    delete: { toggle: boolean; issueId: string | null; issue: IIssue | null };
  }>({
    create: {
      toggle: false,
      issueId: null,
    },
    existing: {
      toggle: false,
      issueId: null,
    },
    edit: {
      toggle: false,
      issueId: null, // parent issue id for mutation
      issue: null,
    },
    delete: {
      toggle: false,
      issueId: null, // parent issue id for mutation
      issue: null,
    },
  });
  const handleIssueCrudOperation = (
    key: "create" | "existing" | "edit" | "delete",
    issueId: string | null,
    issue: IIssue | null = null
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

  const addAsSubIssueFromExistingIssues = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !parentIssue || issueCrudOperation?.existing?.issueId === null) return;
    const issueId = issueCrudOperation?.existing?.issueId;
    const payload = {
      sub_issue_ids: data.map((i) => i.id),
    };
    await issueService.addSubIssues(workspaceSlug, projectId, issueId, payload).finally(() => {
      if (issueId) mutate(SUB_ISSUES(issueId));
    });
  };

  const removeIssueFromSubIssues = async (parentIssueId: string, issue: IIssue) => {
    if (!workspaceSlug || !parentIssue || !issue?.id) return;
    issueService
      .patchIssue(workspaceSlug, projectId, issue.id, { parent: null }, user)
      .then(async () => {
        if (parentIssueId) await mutate(SUB_ISSUES(parentIssueId));
        handleIssuesLoader({ key: "delete", issueId: issue?.id });
        setToastAlert({
          type: "success",
          title: `Issue removed!`,
          message: `Issue removed successfully.`,
        });
      })
      .catch(() => {
        handleIssuesLoader({ key: "delete", issueId: issue?.id });
        setToastAlert({
          type: "warning",
          title: `Error!`,
          message: `Error, Please try again later.`,
        });
      });
  };

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

  const isEditable = memberRole?.isGuest || memberRole?.isViewer ? false : true;

  const mutateSubIssues = (parentIssueId: string | null) => {
    if (parentIssueId) mutate(SUB_ISSUES(parentIssueId));
  };

  return (
    <div className="w-full h-full space-y-2">
      {!issues && isLoading ? (
        <div className="py-3 text-center text-sm  text-custom-text-300 font-medium">Loading...</div>
      ) : (
        <>
          {issues && issues?.sub_issues && issues?.sub_issues?.length > 0 ? (
            <>
              {/* header */}
              <div className="relative flex items-center gap-4 text-xs">
                <div
                  className="rounded border border-custom-border-100 shadow p-1.5 px-2 flex items-center gap-1 hover:bg-custom-background-80 transition-all cursor-pointer select-none"
                  onClick={() => handleIssuesLoader({ key: "visibility", issueId: parentIssue?.id })}
                >
                  <div className="flex-shrink-0 w-[16px] h-[16px] flex justify-center items-center">
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

                {isEditable && issuesLoader.visibility.includes(parentIssue?.id) && (
                  <div className="ml-auto flex-shrink-0 flex items-center gap-2 select-none">
                    <div
                      className="hover:bg-custom-background-80 transition-all cursor-pointer p-1.5 px-2 rounded border border-custom-border-100 shadow"
                      onClick={() => handleIssueCrudOperation("create", parentIssue?.id)}
                    >
                      Add sub-issue
                    </div>
                    <div
                      className="hover:bg-custom-background-80 transition-all cursor-pointer p-1.5 px-2 rounded border border-custom-border-100 shadow"
                      onClick={() => handleIssueCrudOperation("existing", parentIssue?.id)}
                    >
                      Add an existing issue
                    </div>
                  </div>
                )}
              </div>

              {/* issues */}
              {issuesLoader.visibility.includes(parentIssue?.id) && (
                <div className="border border-b-0 border-custom-border-100">
                  <SubIssuesRootList
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    parentIssue={parentIssue}
                    user={undefined}
                    editable={isEditable}
                    removeIssueFromSubIssues={removeIssueFromSubIssues}
                    issuesLoader={issuesLoader}
                    handleIssuesLoader={handleIssuesLoader}
                    copyText={copyText}
                    handleIssueCrudOperation={handleIssueCrudOperation}
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
                  // position="left"
                  noBorder
                  noChevron
                >
                  <CustomMenu.MenuItem
                    onClick={() => {
                      mutateSubIssues(parentIssue?.id);
                      handleIssueCrudOperation("create", parentIssue?.id);
                    }}
                  >
                    Create new
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem
                    onClick={() => {
                      mutateSubIssues(parentIssue?.id);
                      handleIssueCrudOperation("existing", parentIssue?.id);
                    }}
                  >
                    Add an existing issue
                  </CustomMenu.MenuItem>
                </CustomMenu>
              </div>
            </>
          ) : (
            isEditable && (
              <div className="flex justify-between items-center">
                <div className="text-xs py-2 text-custom-text-300 italic">No Sub-Issues yet</div>
                <div>
                  <CustomMenu
                    label={
                      <>
                        <Plus className="h-3 w-3" />
                        Add sub-issue
                      </>
                    }
                    buttonClassName="whitespace-nowrap"
                    // position="left"
                    noBorder
                    noChevron
                  >
                    <CustomMenu.MenuItem
                      onClick={() => {
                        mutateSubIssues(parentIssue?.id);
                        handleIssueCrudOperation("create", parentIssue?.id);
                      }}
                    >
                      Create new
                    </CustomMenu.MenuItem>
                    <CustomMenu.MenuItem
                      onClick={() => {
                        mutateSubIssues(parentIssue?.id);
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
          {isEditable && issueCrudOperation?.create?.toggle && (
            <CreateUpdateIssueModal
              isOpen={issueCrudOperation?.create?.toggle}
              prePopulateData={{
                parent: issueCrudOperation?.create?.issueId,
              }}
              handleClose={() => {
                mutateSubIssues(issueCrudOperation?.create?.issueId);
                handleIssueCrudOperation("create", null);
              }}
            />
          )}
          {isEditable && issueCrudOperation?.existing?.toggle && issueCrudOperation?.existing?.issueId && (
            <ExistingIssuesListModal
              isOpen={issueCrudOperation?.existing?.toggle}
              handleClose={() => handleIssueCrudOperation("existing", null)}
              searchParams={{ sub_issue: true, issue_id: issueCrudOperation?.existing?.issueId }}
              handleOnSubmit={addAsSubIssueFromExistingIssues}
              workspaceLevelToggle
            />
          )}
          {isEditable && issueCrudOperation?.edit?.toggle && issueCrudOperation?.edit?.issueId && (
            <>
              <CreateUpdateIssueModal
                isOpen={issueCrudOperation?.edit?.toggle}
                handleClose={() => {
                  mutateSubIssues(issueCrudOperation?.edit?.issueId);
                  handleIssueCrudOperation("edit", null, null);
                }}
                data={issueCrudOperation?.edit?.issue}
              />
            </>
          )}
          {isEditable && issueCrudOperation?.delete?.toggle && issueCrudOperation?.delete?.issueId && (
            <DeleteIssueModal
              isOpen={issueCrudOperation?.delete?.toggle}
              handleClose={() => {
                mutateSubIssues(issueCrudOperation?.delete?.issueId);
                handleIssueCrudOperation("delete", null, null);
              }}
              data={issueCrudOperation?.delete?.issue}
              user={user}
              redirection={false}
            />
          )}
        </>
      )}
    </div>
  );
};
