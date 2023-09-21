import React from "react";
// next imports
import { useRouter } from "next/router";
// swr
import useSWR, { mutate } from "swr";
// lucide icons
import { Plus, ChevronRight, ChevronDown } from "lucide-react";
// components
import { ExistingIssuesListModal } from "components/core";
import { CreateUpdateIssueModal } from "components/issues";
import { SubIssuesRootList } from "./issues-list";
import { ProgressBar } from "./progressbar";
// ui
import { CustomMenu } from "components/ui";
// hooks
import { useProjectMyMembership } from "contexts/project-member.context";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import { ICurrentUserResponse, IIssue, ISearchIssueResponse } from "types";
// services
import issuesService from "services/issues.service";
// fetch keys
import { SUB_ISSUES } from "constants/fetch-keys";

export interface ISubIssuesRoot {
  parentIssue: IIssue;

  user: ICurrentUserResponse | undefined;
  editable: boolean;
}

export const SubIssuesRoot: React.FC<ISubIssuesRoot> = ({ parentIssue, user, editable }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };

  const { memberRole } = useProjectMyMembership();

  const { data: issues } = useSWR(
    workspaceSlug && projectId && parentIssue && parentIssue?.id
      ? SUB_ISSUES(parentIssue?.id)
      : null,
    workspaceSlug && projectId && parentIssue && parentIssue?.id
      ? () => issuesService.subIssues(workspaceSlug, projectId, parentIssue.id)
      : null
  );

  const [issuesVisibility, setIssuesVisibility] = React.useState<string[]>([parentIssue?.id]);
  const handleIssuesVisibility = (issueId: string) => {
    if (issuesVisibility.includes(issueId)) {
      setIssuesVisibility(issuesVisibility.filter((i: string) => i !== issueId));
    } else {
      setIssuesVisibility([...issuesVisibility, issueId]);
    }
  };

  const [issueCreateOption, setIssueCreateOption] = React.useState<{
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
  const handleCreateOption = (key: "create" | "existing", issueId: string | null) => {
    setIssueCreateOption({
      ...issueCreateOption,
      [key]: {
        toggle: !issueCreateOption[key].toggle,
        issueId: issueId,
      },
    });
  };

  const addAsSubIssueFromExistingIssues = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !parentIssue || issueCreateOption?.existing?.issueId === null) return;
    const issueId = issueCreateOption?.existing?.issueId;
    const payload = {
      sub_issue_ids: data.map((i) => i.id),
    };

    await issuesService.addSubIssues(workspaceSlug, projectId, issueId, payload).finally(() => {
      if (issueId) mutate(SUB_ISSUES(issueId), true);
    });
  };

  const removeIssueFromSubIssues = async (parentIssueId: string, issue: IIssue) => {
    if (!workspaceSlug || !parentIssue || !issue?.id) return;
    issuesService
      .patchIssue(workspaceSlug, projectId, issue.id, { parent: null }, user)
      .finally(() => {
        if (parentIssueId) mutate(SUB_ISSUES(parentIssueId), true);
      });
  };

  const copyText = (text: string) => {
    const originURL =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    copyTextToClipboard(`${originURL}/${text}`).then(() => {
      // setToastAlert({
      //   type: "success",
      //   title: "Link Copied!",
      //   message: "Issue link copied to clipboard.",
      // });
    });
  };

  const isEditable = memberRole?.isGuest || memberRole?.isViewer ? false : true;

  console.log("isEditable", isEditable);

  return (
    <div className="w-full h-full space-y-2">
      {parentIssue && parentIssue?.sub_issues_count > 0 ? (
        <>
          {/* header */}
          <div className="relative flex items-center gap-4 text-xs">
            <div
              className="rounded border border-custom-border-100 shadow p-1.5 px-2 flex items-center gap-1 hover:bg-custom-background-80 transition-all cursor-pointer select-none"
              onClick={() => handleIssuesVisibility(parentIssue?.id)}
            >
              <div className="flex-shrink-0 w-[16px] h-[16px] flex justify-center items-center">
                {!issuesVisibility.includes(parentIssue?.id) ? (
                  <ChevronDown width={16} strokeWidth={2} />
                ) : (
                  <ChevronRight width={14} strokeWidth={2} />
                )}
              </div>
              <div>Sub-issues</div>
              <div>({parentIssue?.sub_issues_count})</div>
            </div>

            <div className="w-full max-w-[250px] select-none">
              <ProgressBar
                total={parentIssue?.sub_issues_count}
                done={
                  (issues?.state_distribution?.cancelled || 0) +
                  (issues?.state_distribution?.completed || 0)
                }
              />
            </div>

            {isEditable && issuesVisibility.includes(parentIssue?.id) && (
              <div className="ml-auto flex-shrink-0 flex items-center gap-2 select-none">
                <div
                  className="hover:bg-custom-background-80 transition-all cursor-pointer p-1.5 px-2 rounded border border-custom-border-100 shadow"
                  onClick={() => handleCreateOption("create", parentIssue?.id)}
                >
                  Add sub-issue
                </div>
                <div
                  className="hover:bg-custom-background-80 transition-all cursor-pointer p-1.5 px-2 rounded border border-custom-border-100 shadow"
                  onClick={() => handleCreateOption("existing", parentIssue?.id)}
                >
                  Add an existing issue
                </div>
              </div>
            )}
          </div>

          {/* issues */}
          {issuesVisibility.includes(parentIssue?.id) && (
            <div className="border border-b-0 border-custom-border-100">
              <SubIssuesRootList
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                parentIssue={parentIssue}
                user={undefined}
                editable={isEditable}
                removeIssueFromSubIssues={removeIssueFromSubIssues}
                issuesVisibility={issuesVisibility}
                handleIssuesVisibility={handleIssuesVisibility}
                copyText={copyText}
              />
            </div>
          )}
        </>
      ) : (
        isEditable && (
          <div className="text-xs py-2 text-custom-text-300 font-medium">
            <div className="py-3 text-center">No sub issues are available</div>
            <>
              <CustomMenu
                label={
                  <>
                    <Plus className="h-3 w-3" />
                    Add sub-issue
                  </>
                }
                buttonClassName="whitespace-nowrap"
                position="left"
                noBorder
                noChevron
              >
                <CustomMenu.MenuItem onClick={() => handleCreateOption("create", parentIssue?.id)}>
                  Create new
                </CustomMenu.MenuItem>
                <CustomMenu.MenuItem
                  onClick={() => handleCreateOption("existing", parentIssue?.id)}
                >
                  Add an existing issue
                </CustomMenu.MenuItem>
              </CustomMenu>
            </>
          </div>
        )
      )}

      {isEditable && issueCreateOption?.create?.toggle && issueCreateOption?.create?.issueId && (
        <CreateUpdateIssueModal
          isOpen={issueCreateOption?.create?.toggle}
          prePopulateData={{
            parent: issueCreateOption?.create?.issueId,
          }}
          handleClose={() => handleCreateOption("create", null)}
        />
      )}

      {isEditable &&
        issueCreateOption?.existing?.toggle &&
        issueCreateOption?.existing?.issueId && (
          <ExistingIssuesListModal
            isOpen={issueCreateOption?.existing?.toggle}
            handleClose={() => handleCreateOption("existing", null)}
            searchParams={{ sub_issue: true, issue_id: issueCreateOption?.existing?.issueId }}
            handleOnSubmit={addAsSubIssueFromExistingIssues}
            workspaceLevelToggle
          />
        )}
    </div>
  );
};
