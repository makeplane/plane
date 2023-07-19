import Link from "next/link";
import { useRouter } from "next/router";

import useSWR from "swr";

// services
import issuesService from "services/issues.service";
// hooks
import useUserAuth from "hooks/use-user-auth";
// contexts
import { useProjectMyMembership } from "contexts/project-member.context";
// components
import {
  AddComment,
  IssueActivitySection,
  IssueAttachmentUpload,
  IssueAttachments,
  IssueDescriptionForm,
  SubIssuesList,
} from "components/issues";
// ui
import { CustomMenu } from "components/ui";
// types
import { IIssue } from "types";
// fetch-keys
import { SUB_ISSUES } from "constants/fetch-keys";

type Props = {
  issueDetails: IIssue;
  submitChanges: (formData: Partial<IIssue>) => Promise<void>;
  uneditable?: boolean;
};

export const IssueMainContent: React.FC<Props> = ({
  issueDetails,
  submitChanges,
  uneditable = false,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId, issueId, archivedIssueId } = router.query;

  const { user } = useUserAuth();
  const { memberRole } = useProjectMyMembership();

  const { data: siblingIssues } = useSWR(
    workspaceSlug && projectId && issueDetails?.parent ? SUB_ISSUES(issueDetails.parent) : null,
    workspaceSlug && projectId && issueDetails?.parent
      ? () =>
          issuesService.subIssues(
            workspaceSlug as string,
            projectId as string,
            issueDetails.parent ?? ""
          )
      : null
  );

  return (
    <>
      <div className="rounded-lg">
        {issueDetails?.parent && issueDetails.parent !== "" ? (
          <div className="mb-5 flex w-min items-center gap-2 whitespace-nowrap rounded bg-custom-background-90 p-2 text-xs">
            <Link href={`/${workspaceSlug}/projects/${projectId}/issues/${issueDetails.parent}`}>
              <a className="flex items-center gap-2 text-custom-text-200">
                <span
                  className="block h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: issueDetails?.state_detail?.color,
                  }}
                />
                <span className="flex-shrink-0">
                  {issueDetails.project_detail.identifier}-{issueDetails.parent_detail?.sequence_id}
                </span>
                <span className="truncate">
                  {issueDetails.parent_detail?.name.substring(0, 50)}
                </span>
              </a>
            </Link>

            <CustomMenu position="left" ellipsis>
              {siblingIssues && siblingIssues.sub_issues.length > 0 ? (
                <>
                  <h2 className="text-custom-text-200 px-1 mb-2">Sibling issues</h2>
                  {siblingIssues.sub_issues.map((issue) => {
                    if (issue.id !== issueDetails.id)
                      return (
                        <CustomMenu.MenuItem
                          key={issue.id}
                          renderAs="a"
                          href={`/${workspaceSlug}/projects/${projectId as string}/issues/${
                            issue.id
                          }`}
                        >
                          {issueDetails.project_detail.identifier}-{issue.sequence_id}
                        </CustomMenu.MenuItem>
                      );
                  })}
                </>
              ) : (
                <p className="flex items-center gap-2 whitespace-nowrap px-1 text-left text-xs text-custom-text-200 py-1">
                  No sibling issues
                </p>
              )}
              <CustomMenu.MenuItem
                renderAs="button"
                onClick={() => submitChanges({ parent: null })}
              >
                Remove parent issue
              </CustomMenu.MenuItem>
            </CustomMenu>
          </div>
        ) : null}
        <IssueDescriptionForm
          issue={issueDetails}
          handleFormSubmit={submitChanges}
          isAllowed={memberRole.isMember || memberRole.isOwner || !uneditable}
        />
        <div className="mt-2 space-y-2">
          <SubIssuesList parentIssue={issueDetails} user={user} disabled={uneditable} />
        </div>
      </div>
      <div className="flex flex-col gap-3 py-3">
        <h3 className="text-lg">Attachments</h3>
        <div className="grid  grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <IssueAttachmentUpload disabled={uneditable} />
          <IssueAttachments />
        </div>
      </div>
      <div className="space-y-5 pt-3">
        <h3 className="text-lg text-custom-text-100">Comments/Activity</h3>
        <IssueActivitySection
          issueId={(archivedIssueId as string) ?? (issueId as string)}
          user={user}
        />
        <AddComment
          issueId={(archivedIssueId as string) ?? (issueId as string)}
          user={user}
          disabled={uneditable}
        />
      </div>
    </>
  );
};
