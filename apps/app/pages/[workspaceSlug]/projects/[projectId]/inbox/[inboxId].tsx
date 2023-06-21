import { useState, useEffect, useCallback } from "react";

import Router, { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import inboxServices from "services/inbox.service";
import projectService from "services/project.service";
// hooks
import useInboxView from "hooks/use-inbox-view";
import useUserAuth from "hooks/use-user-auth";
import useToast from "hooks/use-toast";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// contexts
import { InboxViewContextProvider } from "contexts/inbox-view-context";
// components
import {
  InboxActionHeader,
  InboxMainContent,
  SelectDuplicateInboxIssueModal,
  DeclineIssueModal,
  DeleteIssueModal,
  IssuesListSidebar,
} from "components/inbox";
// helper
import { truncateText } from "helpers/string.helper";
// ui
import { PrimaryButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
import { InboxIcon } from "components/icons";
// types
import { IInboxIssueDetail, TInboxStatus } from "types";
import type { NextPage } from "next";
// fetch-keys
import { INBOX_ISSUE_DETAILS, PROJECT_DETAILS } from "constants/fetch-keys";

const ProjectInbox: NextPage = () => {
  const [selectDuplicateIssue, setSelectDuplicateIssue] = useState(false);
  const [declineIssueModal, setDeclineIssueModal] = useState(false);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, inboxId, inboxIssueId } = router.query;

  const { user } = useUserAuth();
  const { issues: inboxIssues, mutate: mutateInboxIssues } = useInboxView();
  const { setToastAlert } = useToast();

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!inboxIssues || !inboxIssueId) return;

      const currentIssueIndex = inboxIssues.findIndex((issue) => issue.bridge_id === inboxIssueId);

      switch (e.key) {
        case "ArrowUp":
          Router.push({
            pathname: `/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}`,
            query: {
              inboxIssueId:
                currentIssueIndex === 0
                  ? inboxIssues[inboxIssues.length - 1].bridge_id
                  : inboxIssues[currentIssueIndex - 1].bridge_id,
            },
          });
          break;
        case "ArrowDown":
          Router.push({
            pathname: `/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}`,
            query: {
              inboxIssueId:
                currentIssueIndex === inboxIssues.length - 1
                  ? inboxIssues[0].bridge_id
                  : inboxIssues[currentIssueIndex + 1].bridge_id,
            },
          });

          break;
        default:
          break;
      }
    },
    [workspaceSlug, projectId, inboxIssueId, inboxId, inboxIssues]
  );

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  const markInboxStatus = async (data: TInboxStatus) => {
    if (!workspaceSlug || !projectId || !inboxId || !inboxIssueId) return;

    mutate<IInboxIssueDetail>(
      INBOX_ISSUE_DETAILS(inboxId as string, inboxIssueId as string),
      (prevData) => {
        if (!prevData) return prevData;

        return {
          ...prevData,
          issue_inbox: [{ ...prevData.issue_inbox[0], ...data }],
        };
      },
      false
    );
    mutateInboxIssues(
      (prevData) =>
        (prevData ?? []).map((i) =>
          i.bridge_id === inboxIssueId
            ? { ...i, issue_inbox: [{ ...i.issue_inbox[0], ...data }] }
            : i
        ),
      false
    );

    await inboxServices
      .markInboxStatus(
        workspaceSlug.toString(),
        projectId.toString(),
        inboxId.toString(),
        inboxIssues?.find((inboxIssue) => inboxIssue.bridge_id === inboxIssueId)?.bridge_id!,
        data,
        user
      )
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Something went wrong while updating inbox status. Please try again.",
        })
      )
      .finally(() => {
        mutate(INBOX_ISSUE_DETAILS(inboxId as string, inboxIssueId as string));
        mutateInboxIssues();
      });
  };

  return (
    <InboxViewContextProvider>
      <ProjectAuthorizationWrapper
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
            <BreadcrumbItem
              title={`${truncateText(projectDetails?.name ?? "Project", 12)} Inbox`}
            />
          </Breadcrumbs>
        }
        right={
          <div className="flex items-center gap-2">
            <PrimaryButton
              className="flex items-center gap-2"
              onClick={() => {
                const e = new KeyboardEvent("keydown", { key: "c" });
                document.dispatchEvent(e);
              }}
            >
              <PlusIcon className="h-4 w-4" />
              Add Issue
            </PrimaryButton>
          </div>
        }
      >
        <>
          <SelectDuplicateInboxIssueModal
            isOpen={selectDuplicateIssue}
            onClose={() => setSelectDuplicateIssue(false)}
            value={
              inboxIssues?.find((inboxIssue) => inboxIssue.bridge_id === inboxIssueId)
                ?.issue_inbox[0].duplicate_to
            }
            onSubmit={(dupIssueId: string) => {
              markInboxStatus({
                status: 2,
                duplicate_to: dupIssueId,
              }).finally(() => setSelectDuplicateIssue(false));
            }}
          />
          <DeclineIssueModal
            isOpen={declineIssueModal}
            handleClose={() => setDeclineIssueModal(false)}
            data={inboxIssues?.find((i) => i.bridge_id === inboxIssueId)}
            onSubmit={async () => {
              await markInboxStatus({
                status: -1,
              }).finally(() => setDeclineIssueModal(false));
            }}
          />
          <DeleteIssueModal
            isOpen={deleteIssueModal}
            handleClose={() => setDeleteIssueModal(false)}
            data={inboxIssues?.find((i) => i.bridge_id === inboxIssueId)}
          />
          <div className="flex flex-col h-full">
            <InboxActionHeader
              issue={inboxIssues?.find((issue) => issue.bridge_id === inboxIssueId)}
              currentIssueIndex={
                inboxIssues?.findIndex((issue) => issue.bridge_id === inboxIssueId) ?? 0
              }
              issueCount={inboxIssues?.length ?? 0}
              onAccept={() =>
                markInboxStatus({
                  status: 1,
                })
              }
              onDecline={() => setDeclineIssueModal(true)}
              onMarkAsDuplicate={() => setSelectDuplicateIssue(true)}
              onSnooze={(date) => {
                markInboxStatus({
                  status: 0,
                  snoozed_till: new Date(date),
                });
              }}
              onDelete={() => setDeleteIssueModal(true)}
            />
            <div className="grid grid-cols-4 flex-1 divide-x divide-brand-base overflow-hidden">
              <IssuesListSidebar />
              <div className="col-span-3 h-full overflow-auto">
                {inboxIssueId ? (
                  <InboxMainContent />
                ) : (
                  <div className="h-full p-4 grid place-items-center text-brand-secondary">
                    <div className="grid h-full place-items-center">
                      <div className="my-5 flex flex-col items-center gap-4">
                        <InboxIcon height={60} width={60} />
                        {inboxIssues && inboxIssues.length > 0 ? (
                          <span className="text-brand-secondary">
                            {inboxIssues?.length} issues found. Select an issue from the sidebar to
                            view its details.
                          </span>
                        ) : (
                          <span className="text-brand-secondary">
                            No issues found. Use{" "}
                            <pre className="inline rounded bg-brand-surface-2 px-2 py-1">C</pre>{" "}
                            shortcut to create a new issue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      </ProjectAuthorizationWrapper>
    </InboxViewContextProvider>
  );
};

export default ProjectInbox;
