import { useState, useEffect, useCallback } from "react";

import Link from "next/link";
import Router, { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react hook form
import { useForm } from "react-hook-form";
// services
import inboxServices from "services/inbox.service";
import projectService from "services/project.service";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// contexts
import { IssueViewContextProvider } from "contexts/issue-view.context";
// components
import {
  InboxIssueCard,
  InboxActionHeader,
  InboxMainContent,
  SelectDuplicateInboxIssueModal,
} from "components/inbox";
// helper
import { truncateText } from "helpers/string.helper";
// ui
import { PrimaryButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import type { NextPage } from "next";
// fetch-keys
import { INBOX_ISSUES, ISSUE_DETAILS, PROJECT_DETAILS } from "constants/fetch-keys";

// types
import type { IIssue } from "types";

const defaultValues = {
  name: "",
  description: "",
  description_html: "",
  estimate_point: null,
  state: "",
  assignees_list: [],
  priority: "low",
  blockers_list: [],
  blocked_list: [],
  target_date: new Date().toString(),
  issue_cycle: null,
  issue_module: null,
  labels_list: [],
};

const ProjectIssues: NextPage = () => {
  const router = useRouter();

  const { workspaceSlug, projectId, inboxId, issueId } = router.query;

  const [selectDuplicateIssue, setSelectDuplicateIssue] = useState(false);

  const { reset, control, watch } = useForm<IIssue>({
    defaultValues,
  });

  const { data: inboxIssues, mutate: inboxIssuesMutate } = useSWR(
    workspaceSlug && projectId && inboxId ? INBOX_ISSUES(inboxId.toString()) : null,
    workspaceSlug && projectId && inboxId
      ? () =>
          inboxServices.getInboxIssues(
            workspaceSlug as string,
            projectId as string,
            inboxId as string
          )
      : null
  );

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!inboxIssues) return;

      if (!issueId) return;

      const currentIssueIndex = inboxIssues.findIndex((issue) => issue.issue === issueId);

      switch (e.key) {
        case "ArrowUp":
          Router.push({
            pathname: `/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}`,
            query: {
              issueId:
                currentIssueIndex === 0
                  ? inboxIssues[inboxIssues.length - 1].issue
                  : inboxIssues[currentIssueIndex - 1].issue,
            },
          });
          break;
        case "ArrowDown":
          Router.push({
            pathname: `/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}`,
            query: {
              issueId:
                currentIssueIndex === inboxIssues.length - 1
                  ? inboxIssues[0].issue
                  : inboxIssues[currentIssueIndex + 1].issue,
            },
          });

          break;
        default:
          break;
      }
    },
    [workspaceSlug, projectId, issueId, inboxId, inboxIssues]
  );

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  useEffect(() => {
    if (!inboxIssues || inboxIssues.length === 0) return;

    if (!workspaceSlug || !projectId || !inboxId) return;

    Router.push({
      pathname: `/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}`,
      query: {
        issueId: inboxIssues[0].issue,
      },
    });
  }, [inboxIssues, workspaceSlug, projectId, inboxId]);

  if (inboxIssues && inboxIssues.length === 0)
    return (
      <IssueViewContextProvider>
        <ProjectAuthorizationWrapper
          breadcrumbs={
            <Breadcrumbs>
              <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
              <BreadcrumbItem
                title={`${truncateText(projectDetails?.name ?? "Project", 12)} Issues`}
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
          <div className="flex justify-center items-center h-full">
            <h2 className="text-gray-400 font-medium text-lg text-center">
              No inbox issues found in this inbox.
            </h2>
          </div>
        </ProjectAuthorizationWrapper>
      </IssueViewContextProvider>
    );

  return (
    <IssueViewContextProvider>
      <ProjectAuthorizationWrapper
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
            <BreadcrumbItem
              title={`${truncateText(projectDetails?.name ?? "Project", 12)} Issues`}
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
        <div className="flex flex-col h-full">
          <InboxActionHeader
            currentIssueIndex={inboxIssues?.findIndex((issue) => issue.issue === issueId) ?? 0}
            issueCount={inboxIssues?.length ?? 0}
            onAccept={() => {
              inboxServices
                .markInboxStatus(
                  workspaceSlug!.toString(),
                  projectId!.toString(),
                  inboxId!.toString(),
                  inboxIssues?.find((inboxIssue) => inboxIssue.issue === issueId)?.id!,
                  {
                    status: 1,
                  }
                )
                .then(() => {
                  mutate(ISSUE_DETAILS(issueId as string), undefined);
                  inboxIssuesMutate((prevData) =>
                    prevData?.map((item) =>
                      item.issue === issueId ? { ...item, status: 1 } : item
                    )
                  );
                });
            }}
            onDecline={() => {
              inboxServices
                .markInboxStatus(
                  workspaceSlug!.toString(),
                  projectId!.toString(),
                  inboxId!.toString(),
                  inboxIssues?.find((inboxIssue) => inboxIssue.issue === issueId)?.id!,
                  {
                    status: -1,
                  }
                )
                .then(() => {
                  reset(defaultValues);
                  mutate(ISSUE_DETAILS(issueId as string), undefined);
                  inboxIssuesMutate((prevData) =>
                    prevData?.map((item) =>
                      item.issue === issueId ? { ...item, status: -1 } : item
                    )
                  );
                });
            }}
            onMarkAsDuplicate={() => {
              setSelectDuplicateIssue(true);
            }}
            onSnooze={(date) => {
              inboxServices
                .markInboxStatus(
                  workspaceSlug!.toString(),
                  projectId!.toString(),
                  inboxId!.toString(),
                  inboxIssues?.find((inboxIssue) => inboxIssue.issue === issueId)?.id!,
                  {
                    status: 0,
                    snoozed_till: new Date(date),
                  }
                )
                .then(() => {
                  reset(defaultValues);
                  mutate(ISSUE_DETAILS(issueId as string), undefined);
                  inboxIssuesMutate((prevData) =>
                    prevData?.map((item) =>
                      item.issue === issueId
                        ? { ...item, status: 0, snoozed_till: new Date(date) }
                        : item
                    )
                  );
                });
            }}
          />

          <div className="grid grid-cols-4 flex-1 overflow-auto divide-x">
            <div className="divide-y col-span-1 overflow-auto h-full pb-10">
              {inboxIssues?.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}?issueId=${issue.issue}`}
                >
                  <a>
                    <InboxIssueCard active={issue.issue === issueId} issue={issue} />
                  </a>
                </Link>
              ))}
            </div>
            <div className="col-span-3 h-full overflow-auto">
              <InboxMainContent
                reset={reset}
                watch={watch}
                control={control}
                status={inboxIssues?.find((inboxIssue) => inboxIssue.issue === issueId)?.status}
                onAccept={() => {
                  inboxServices
                    .markInboxStatus(
                      workspaceSlug!.toString(),
                      projectId!.toString(),
                      inboxId!.toString(),
                      inboxIssues?.find((inboxIssue) => inboxIssue.issue === issueId)?.id!,
                      {
                        status: 1,
                      }
                    )
                    .then(() => {
                      reset(defaultValues);
                      mutate(ISSUE_DETAILS(issueId as string), undefined);
                      inboxIssuesMutate((prevData) =>
                        (prevData ?? [])?.map((item) => ({
                          ...item,
                          status: item.issue === issueId ? 1 : item.status,
                        }))
                      );
                    });
                }}
              />
            </div>
          </div>
        </div>

        <SelectDuplicateInboxIssueModal
          isOpen={selectDuplicateIssue}
          onClose={() => setSelectDuplicateIssue(false)}
          onSubmit={(dupIssueId: string) => {
            inboxServices
              .markInboxStatus(
                workspaceSlug!.toString(),
                projectId!.toString(),
                inboxId!.toString(),
                inboxIssues?.find((inboxIssue) => inboxIssue.issue === issueId)?.id!,
                {
                  status: 2,
                  duplicate_to: dupIssueId,
                }
              )
              .then(() => {
                reset(defaultValues);
                setSelectDuplicateIssue(false);
                mutate(ISSUE_DETAILS(issueId as string), undefined);
                inboxIssuesMutate((prevData) =>
                  (prevData ?? [])?.map((item) => ({
                    ...item,
                    status: item.issue === issueId ? 2 : item.status,
                    duplicate_to: dupIssueId,
                  }))
                );
              })
              .catch(() => {
                setSelectDuplicateIssue(false);
              });
          }}
        />
      </ProjectAuthorizationWrapper>
    </IssueViewContextProvider>
  );
};

export default ProjectIssues;
