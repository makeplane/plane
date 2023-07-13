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
          <div className="mb-5 flex w-min items-center gap-2 whitespace-nowrap rounded bg-custom-background-80 p-2 text-xs">
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

            <CustomMenu ellipsis position="left">
              {siblingIssues && siblingIssues.length > 0 ? (
                siblingIssues.map((issue: IIssue) => (
                  <CustomMenu.MenuItem key={issue.id}>
                    <Link
                      href={`/${workspaceSlug}/projects/${projectId as string}/issues/${issue.id}`}
                    >
                      <a>
                        {issueDetails.project_detail.identifier}-{issue.sequence_id}
                      </a>
                    </Link>
                  </CustomMenu.MenuItem>
                ))
              ) : (
                <CustomMenu.MenuItem className="flex items-center gap-2 whitespace-nowrap p-2 text-left text-xs text-custom-text-200">
                  No other sibling issues
                </CustomMenu.MenuItem>
              )}
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
