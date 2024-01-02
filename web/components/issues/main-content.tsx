import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR, { mutate } from "swr";
import { MinusCircle } from "lucide-react";
// hooks
import { useApplication, useIssues, useProject, useProjectState, useUser, useWorkspace } from "hooks/store";
import useToast from "hooks/use-toast";
// services
import { IssueService, IssueCommentService } from "services/issue";
// components
import {
  IssueAttachmentRoot,
  AddComment,
  IssueActivitySection,
  IssueDescriptionForm,
  IssueReaction,
  IssueUpdateStatus,
} from "components/issues";
import { useState } from "react";
import { SubIssuesRoot } from "./sub-issues";
// ui
import { CustomMenu, LayersIcon, StateGroupIcon } from "@plane/ui";
// types
import { TIssue, IIssueActivity } from "@plane/types";
// fetch-keys
import { PROJECT_ISSUES_ACTIVITY, SUB_ISSUES } from "constants/fetch-keys";
// constants
import { EUserProjectRoles } from "constants/project";

type Props = {
  issueDetails: TIssue;
  submitChanges: (formData: Partial<TIssue>) => Promise<void>;
  uneditable?: boolean;
};

// services
const issueService = new IssueService();
const issueCommentService = new IssueCommentService();

export const IssueMainContent: React.FC<Props> = observer((props) => {
  const { issueDetails, submitChanges, uneditable = false } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;
  // toast alert
  const { setToastAlert } = useToast();
  const {
    eventTracker: { postHogEventTracker },
  } = useApplication();
  const {
    currentUser,
    membership: { currentProjectRole },
  } = useUser();
  const { currentWorkspace } = useWorkspace();
  const { getProjectById } = useProject();
  const { projectStates, getProjectStates } = useProjectState();
  const { issueMap } = useIssues();

  const projectDetails = projectId ? getProjectById(projectId.toString()) : null;
  const currentIssueState = projectStates?.find((s) => s.id === issueDetails.state_id);

  const { data: siblingIssues } = useSWR(
    workspaceSlug && projectId && issueDetails?.parent_id ? SUB_ISSUES(issueDetails.parent_id) : null,
    workspaceSlug && projectId && issueDetails?.parent_id
      ? () => issueService.subIssues(workspaceSlug.toString(), projectId.toString(), issueDetails.parent_id ?? "")
      : null
  );
  const siblingIssuesList = siblingIssues?.sub_issues.filter((i) => i.id !== issueDetails.id);

  const { data: issueActivity, mutate: mutateIssueActivity } = useSWR(
    workspaceSlug && projectId && issueId ? PROJECT_ISSUES_ACTIVITY(issueId.toString()) : null,
    workspaceSlug && projectId && issueId
      ? () => issueService.getIssueActivities(workspaceSlug.toString(), projectId.toString(), issueId.toString())
      : null
  );

  const handleCommentUpdate = async (commentId: string, data: Partial<IIssueActivity>) => {
    if (!workspaceSlug || !projectId || !issueId) return;

    await issueCommentService
      .patchIssueComment(workspaceSlug as string, projectId as string, issueId as string, commentId, data)
      .then((res) => {
        mutateIssueActivity();
        postHogEventTracker(
          "COMMENT_UPDATED",
          {
            ...res,
            state: "SUCCESS",
          },
          {
            isGrouping: true,
            groupType: "Workspace_metrics",
            groupId: currentWorkspace?.id!,
          }
        );
      });
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!workspaceSlug || !projectId || !issueId || !currentUser) return;

    mutateIssueActivity((prevData: any) => prevData?.filter((p: any) => p.id !== commentId), false);

    await issueCommentService
      .deleteIssueComment(workspaceSlug as string, projectId as string, issueId as string, commentId)
      .then(() => {
        mutateIssueActivity();
        postHogEventTracker(
          "COMMENT_DELETED",
          {
            state: "SUCCESS",
          },
          {
            isGrouping: true,
            groupType: "Workspace_metrics",
            groupId: currentWorkspace?.id!,
          }
        );
      });
  };

  const handleAddComment = async (formData: IIssueActivity) => {
    if (!workspaceSlug || !issueDetails || !currentUser) return;

    await issueCommentService
      .createIssueComment(workspaceSlug.toString(), issueDetails.project_id, issueDetails.id, formData)
      .then((res) => {
        mutate(PROJECT_ISSUES_ACTIVITY(issueDetails.id));
        postHogEventTracker(
          "COMMENT_ADDED",
          {
            ...res,
            state: "SUCCESS",
          },
          {
            isGrouping: true,
            groupType: "Workspace_metrics",
            groupId: currentWorkspace?.id!,
          }
        );
      })
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Comment could not be posted. Please try again.",
        })
      );
  };

  const isAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const parentDetail = issueMap?.[issueDetails.parent_id || ""] || undefined;

  return (
    <>
      <div className="rounded-lg">
        {issueDetails?.parent_id && parentDetail ? (
          <div className="mb-5 flex w-min items-center gap-3 whitespace-nowrap rounded-md border border-custom-border-300 bg-custom-background-80 px-2.5 py-1 text-xs">
            <Link href={`/${workspaceSlug}/projects/${parentDetail?.project_id}/issues/${parentDetail.parent_id}`}>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="block h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: getProjectStates(parentDetail?.project_id)?.find(
                        (state) => state?.id === parentDetail?.state_id
                      )?.color,
                    }}
                  />
                  <span className="flex-shrink-0 text-custom-text-200">
                    {getProjectById(parentDetail?.project_id)?.identifier}-{parentDetail?.sequence_id}
                  </span>
                </div>
                <span className="truncate text-custom-text-100">{(parentDetail?.name ?? "").substring(0, 50)}</span>
              </div>
            </Link>

            <CustomMenu ellipsis optionsClassName="px-1.5">
              {siblingIssuesList ? (
                siblingIssuesList.length > 0 ? (
                  <>
                    <h2 className="mb-1 border-b border-custom-border-300 px-2 pb-1 text-xs font-medium text-custom-text-200">
                      Sibling issues
                    </h2>
                    {siblingIssuesList.map((issue) => (
                      <CustomMenu.MenuItem
                        key={issue.id}
                        onClick={() =>
                          router.push(`/${workspaceSlug}/projects/${projectId as string}/issues/${issue.id}`)
                        }
                        className="flex items-center gap-2 py-2"
                      >
                        <LayersIcon className="h-4 w-4" />
                        {getProjectById(issueDetails?.project_id)?.identifier}-{issue.sequence_id}
                      </CustomMenu.MenuItem>
                    ))}
                  </>
                ) : (
                  <p className="flex items-center gap-2 whitespace-nowrap px-1 py-1 text-left text-xs text-custom-text-200">
                    No sibling issues
                  </p>
                )
              ) : null}
              <CustomMenu.MenuItem
                onClick={() => submitChanges({ parent_id: null })}
                className="flex items-center gap-2 py-2 text-red-500"
              >
                <MinusCircle className="h-4 w-4" />
                <span> Remove Parent Issue</span>
              </CustomMenu.MenuItem>
            </CustomMenu>
          </div>
        ) : null}

        <div className="mb-2.5 flex items-center">
          {currentIssueState && (
            <StateGroupIcon
              className="mr-3 h-4 w-4"
              stateGroup={currentIssueState.group}
              color={currentIssueState.color}
            />
          )}
          <IssueUpdateStatus isSubmitting={isSubmitting} issueDetail={issueDetails} />
        </div>

        <IssueDescriptionForm
          setIsSubmitting={(value) => setIsSubmitting(value)}
          isSubmitting={isSubmitting}
          workspaceSlug={workspaceSlug as string}
          issue={issueDetails}
          handleFormSubmit={submitChanges}
          isAllowed={isAllowed || !uneditable}
        />

        {workspaceSlug && projectId && (
          <IssueReaction
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
            issueId={issueDetails.id}
          />
        )}

        <div className="mt-2 space-y-2">
          <SubIssuesRoot parentIssue={issueDetails} user={currentUser ?? undefined} />
        </div>
      </div>

      {/* issue attachments */}
      <IssueAttachmentRoot isEditable={uneditable} />

      <div className="space-y-5 pt-3">
        <h3 className="text-lg text-custom-text-100">Comments/Activity</h3>
        <IssueActivitySection
          activity={issueActivity}
          handleCommentUpdate={handleCommentUpdate}
          handleCommentDelete={handleCommentDelete}
          showAccessSpecifier={Boolean(projectDetails && projectDetails.is_deployed)}
        />
        <AddComment
          onSubmit={handleAddComment}
          disabled={uneditable}
          showAccessSpecifier={Boolean(projectDetails && projectDetails.is_deployed)}
        />
      </div>
    </>
  );
});
