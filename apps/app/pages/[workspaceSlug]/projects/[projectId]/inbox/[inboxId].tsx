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
  FiltersDropdown,
} from "components/inbox";
// helper
import { truncateText } from "helpers/string.helper";
// ui
import { Loader, PrimaryButton, Spinner } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import type { IInboxFilterOptions, IInboxIssue } from "types";
import type { NextPage } from "next";
// fetch-keys
import {
  INBOX_DETAILS,
  INBOX_ISSUES,
  INBOX_ISSUE_DETAILS,
  ISSUE_DETAILS,
  PROJECT_DETAILS,
} from "constants/fetch-keys";
import useUser from "hooks/use-user";

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
  const [filters, setFilters] = useState<Partial<IInboxFilterOptions>>({});
  const [selectDuplicateIssue, setSelectDuplicateIssue] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, inboxId, inboxIssueId } = router.query;

  const { user } = useUser();

  const { reset, control, watch } = useForm<IInboxIssue>({
    defaultValues,
  });

  const params = {
    priority: filters?.priority ? filters?.priority.join(",") : undefined,
    inbox_status: filters?.inbox_status ? filters?.inbox_status.join(",") : undefined,
  };

  const { data: inboxDetails } = useSWR(
    workspaceSlug && projectId && inboxId ? INBOX_DETAILS(inboxId.toString()) : null,
    workspaceSlug && projectId && inboxId
      ? () =>
          inboxServices.getInboxById(
            workspaceSlug.toString(),
            projectId.toString(),
            inboxId.toString()
          )
      : null
  );

  const { data: inboxIssues, mutate: inboxIssuesMutate } = useSWR(
    workspaceSlug && projectId && inboxId ? INBOX_ISSUES(inboxId.toString(), params) : null,
    workspaceSlug && projectId && inboxId
      ? () =>
          inboxServices.getInboxIssues(
            workspaceSlug as string,
            projectId as string,
            inboxId as string,
            params
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
      if (!inboxIssues || !inboxIssueId) return;

      const currentIssueIndex = inboxIssues.findIndex((issue) => issue.bridge_id === inboxIssueId);

      switch (e.key) {
        case "ArrowUp":
          Router.push({
            pathname: `/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}`,
            query: {
              inboxIssueId:
                currentIssueIndex === 0
                  ? inboxIssues[inboxIssues.length - 1].id
                  : inboxIssues[currentIssueIndex - 1].id,
            },
          });
          break;
        case "ArrowDown":
          Router.push({
            pathname: `/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}`,
            query: {
              inboxIssueId:
                currentIssueIndex === inboxIssues.length - 1
                  ? inboxIssues[0].id
                  : inboxIssues[currentIssueIndex + 1].id,
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

  useEffect(() => {
    if (!inboxIssues || inboxIssues.length === 0) return;

    if (!workspaceSlug || !projectId || !inboxId) return;

    Router.push({
      pathname: `/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}`,
      query: {
        inboxIssueId: inboxIssues[0].bridge_id,
      },
    });
  }, [inboxIssues, workspaceSlug, projectId, inboxId]);

  useEffect(() => {
    if (!inboxDetails || filters) return;

    setFilters(inboxDetails.view_props);
  }, [inboxDetails, filters]);

  return (
    <IssueViewContextProvider>
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
              inboxServices
                .markInboxStatus(
                  workspaceSlug!.toString(),
                  projectId!.toString(),
                  inboxId!.toString(),
                  inboxIssues?.find((inboxIssue) => inboxIssue.bridge_id === inboxIssueId)?.id!,
                  {
                    status: 2,
                    duplicate_to: dupIssueId,
                  },
                  user
                )
                .then(() => {
                  reset(defaultValues);
                  setSelectDuplicateIssue(false);
                  mutate(INBOX_ISSUE_DETAILS(inboxId as string, inboxIssueId as string));
                  inboxIssuesMutate((prevData) =>
                    (prevData ?? [])?.map((item) => ({
                      ...item,
                      status: item.bridge_id === inboxIssueId ? 2 : item.issue_inbox[0].status,
                      duplicate_to: dupIssueId,
                    }))
                  );
                })
                .catch(() => {
                  setSelectDuplicateIssue(false);
                });
            }}
          />
          <div className="flex flex-col h-full">
            <InboxActionHeader
              filters={filters}
              setFilters={setFilters}
              issue={inboxIssues?.find((issue) => issue.bridge_id === inboxIssueId)}
              currentIssueIndex={
                inboxIssues?.findIndex((issue) => issue.bridge_id === inboxIssueId) ?? 0
              }
              issueCount={inboxIssues?.length ?? 0}
              onAccept={() => {
                inboxServices
                  .markInboxStatus(
                    workspaceSlug!.toString(),
                    projectId!.toString(),
                    inboxId!.toString(),
                    inboxIssues?.find((inboxIssue) => inboxIssue.bridge_id === inboxIssueId)
                      ?.bridge_id!,
                    {
                      status: 1,
                    },
                    user
                  )
                  .then(() => {
                    mutate(INBOX_ISSUE_DETAILS(inboxId as string, inboxIssueId as string));
                    inboxIssuesMutate((prevData) =>
                      prevData?.map((item) =>
                        item.bridge_id === inboxIssueId ? { ...item, status: 1 } : item
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
                    inboxIssues?.find((inboxIssue) => inboxIssue.bridge_id === inboxIssueId)
                      ?.bridge_id!,
                    {
                      status: -1,
                    },
                    user
                  )
                  .then(() => {
                    reset(defaultValues);
                    mutate(INBOX_ISSUE_DETAILS(inboxId as string, inboxIssueId as string));
                    inboxIssuesMutate((prevData) =>
                      prevData?.map((item) =>
                        item.bridge_id === inboxIssueId ? { ...item, status: -1 } : item
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
                    inboxIssues?.find((inboxIssue) => inboxIssue.bridge_id === inboxIssueId)
                      ?.bridge_id!,
                    {
                      status: 0,
                      snoozed_till: new Date(date),
                    },
                    user
                  )
                  .then(() => {
                    reset(defaultValues);
                    mutate(INBOX_ISSUE_DETAILS(inboxId as string, inboxIssueId as string));
                    inboxIssuesMutate((prevData) =>
                      prevData?.map((item) =>
                        item.bridge_id === inboxIssueId
                          ? { ...item, status: 0, snoozed_till: new Date(date) }
                          : item
                      )
                    );
                  });
              }}
            />
            <div className="grid grid-cols-4 flex-1 overflow-auto divide-x divide-brand-base">
              {inboxIssues ? (
                inboxIssues.length > 0 ? (
                  <div className="divide-y divide-brand-base overflow-auto h-full pb-10">
                    {inboxIssues.map((issue) => (
                      <Link
                        key={issue.id}
                        href={`/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}?inboxIssueId=${issue.bridge_id}`}
                      >
                        <a>
                          <InboxIssueCard active={issue.bridge_id === inboxIssueId} issue={issue} />
                        </a>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="h-full p-4 grid place-items-center text-center text-sm text-brand-secondary">
                    No issues found for the selected filters. Try changing the filters.
                  </div>
                )
              ) : (
                <Loader className="p-4 space-y-4">
                  <Loader.Item height="50px" />
                  <Loader.Item height="50px" />
                  <Loader.Item height="50px" />
                  <Loader.Item height="50px" />
                </Loader>
              )}
              <div className="col-span-3 h-full overflow-auto">
                <InboxMainContent
                  reset={reset}
                  watch={watch}
                  control={control}
                  status={
                    inboxIssues?.find((inboxIssue) => inboxIssue.bridge_id === inboxIssueId)
                      ?.issue_inbox[0].status
                  }
                  onAccept={() => {
                    inboxServices
                      .markInboxStatus(
                        workspaceSlug!.toString(),
                        projectId!.toString(),
                        inboxId!.toString(),
                        inboxIssues?.find((inboxIssue) => inboxIssue.bridge_id === inboxIssueId)
                          ?.id!,
                        {
                          status: 1,
                        },
                        user
                      )
                      .then(() => {
                        reset(defaultValues);
                        mutate(INBOX_ISSUE_DETAILS(inboxId as string, inboxIssueId as string));
                        inboxIssuesMutate((prevData) =>
                          (prevData ?? [])?.map((item) => ({
                            ...item,
                            status:
                              item.bridge_id === inboxIssueId ? 1 : item.issue_inbox[0].status,
                          }))
                        );
                      });
                  }}
                />
              </div>
            </div>
          </div>
        </>
      </ProjectAuthorizationWrapper>
    </IssueViewContextProvider>
  );
};

export default ProjectIssues;
