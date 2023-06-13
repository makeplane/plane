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
import { PrimaryButton, Spinner } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import type { IInboxFilterOptions, IInboxIssue } from "types";
import type { NextPage } from "next";
// fetch-keys
import { INBOX_DETAILS, INBOX_ISSUES, ISSUE_DETAILS, PROJECT_DETAILS } from "constants/fetch-keys";
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
  const { workspaceSlug, projectId, inboxId, issueId } = router.query;

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
      if (!inboxIssues || !issueId) return;

      const currentIssueIndex = inboxIssues.findIndex((issue) => issue.id === issueId);

      switch (e.key) {
        case "ArrowUp":
          Router.push({
            pathname: `/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}`,
            query: {
              issueId:
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
              issueId:
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
        issueId: inboxIssues[0].id,
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
            <FiltersDropdown
              filters={filters}
              onSelect={(option) => {
                const key = option.key as keyof typeof filters;

                const valueExists = filters[key]?.includes(option.value);

                if (valueExists) {
                  setFilters({
                    ...filters,
                    [option.key]: ((filters[key] ?? []) as any[])?.filter(
                      (val) => val !== option.value
                    ),
                  });
                } else {
                  setFilters({
                    ...filters,
                    [option.key]: [...((filters[key] ?? []) as any[]), option.value],
                  });
                }
              }}
              direction="left"
              height="rg"
            />
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
        {inboxIssues ? (
          inboxIssues.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <h2 className="text-brand-base font-medium text-lg text-center">
                No inbox issues found in this inbox.
              </h2>
            </div>
          ) : (
            <>
              <SelectDuplicateInboxIssueModal
                isOpen={selectDuplicateIssue}
                onClose={() => setSelectDuplicateIssue(false)}
                value={
                  inboxIssues?.find((inboxIssue) => inboxIssue.id === issueId)?.issue_inbox
                    .duplicate_to
                }
                onSubmit={(dupIssueId: string) => {
                  inboxServices
                    .markInboxStatus(
                      workspaceSlug!.toString(),
                      projectId!.toString(),
                      inboxId!.toString(),
                      inboxIssues?.find((inboxIssue) => inboxIssue.id === issueId)?.id!,
                      {
                        status: 2,
                        duplicate_to: dupIssueId,
                      },
                      user
                    )
                    .then(() => {
                      reset(defaultValues);
                      setSelectDuplicateIssue(false);
                      mutate(ISSUE_DETAILS(issueId as string), undefined);
                      inboxIssuesMutate((prevData) =>
                        (prevData ?? [])?.map((item) => ({
                          ...item,
                          status: item.id === issueId ? 2 : item.issue_inbox.status,
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
                  filter={filters}
                  setFilter={setFilters}
                  inboxIssue={inboxIssues?.find((issue) => issue.id === issueId)}
                  currentIssueIndex={inboxIssues?.findIndex((issue) => issue.id === issueId) ?? 0}
                  issueCount={inboxIssues?.length ?? 0}
                  onAccept={() => {
                    inboxServices
                      .markInboxStatus(
                        workspaceSlug!.toString(),
                        projectId!.toString(),
                        inboxId!.toString(),
                        inboxIssues?.find((inboxIssue) => inboxIssue.id === issueId)?.bridge_id!,
                        {
                          status: 1,
                        },
                        user
                      )
                      .then(() => {
                        mutate(ISSUE_DETAILS(issueId as string), undefined);
                        inboxIssuesMutate((prevData) =>
                          prevData?.map((item) =>
                            item.id === issueId ? { ...item, status: 1 } : item
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
                        inboxIssues?.find((inboxIssue) => inboxIssue.id === issueId)?.id!,
                        {
                          status: -1,
                        },
                        user
                      )
                      .then(() => {
                        reset(defaultValues);
                        mutate(ISSUE_DETAILS(issueId as string), undefined);
                        inboxIssuesMutate((prevData) =>
                          prevData?.map((item) =>
                            item.id === issueId ? { ...item, status: -1 } : item
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
                        inboxIssues?.find((inboxIssue) => inboxIssue.id === issueId)?.id!,
                        {
                          status: 0,
                          snoozed_till: new Date(date),
                        },
                        user
                      )
                      .then(() => {
                        reset(defaultValues);
                        mutate(ISSUE_DETAILS(issueId as string), undefined);
                        inboxIssuesMutate((prevData) =>
                          prevData?.map((item) =>
                            item.id === issueId
                              ? { ...item, status: 0, snoozed_till: new Date(date) }
                              : item
                          )
                        );
                      });
                  }}
                />

                <div className="grid grid-cols-4 flex-1 overflow-auto divide-x divide-brand-base">
                  <div className="divide-y divide-brand-base col-span-1 overflow-auto h-full pb-10">
                    {inboxIssues?.map((issue) => (
                      <Link
                        key={issue.id}
                        href={`/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}?issueId=${issue.bridge_id}`}
                      >
                        <a>
                          <InboxIssueCard active={issue.id === issueId} issue={issue} />
                        </a>
                      </Link>
                    ))}
                  </div>
                  <div className="col-span-3 h-full overflow-auto">
                    <InboxMainContent
                      reset={reset}
                      watch={watch}
                      control={control}
                      status={
                        inboxIssues?.find((inboxIssue) => inboxIssue.id === issueId)?.issue_inbox
                          .status
                      }
                      onAccept={() => {
                        inboxServices
                          .markInboxStatus(
                            workspaceSlug!.toString(),
                            projectId!.toString(),
                            inboxId!.toString(),
                            inboxIssues?.find((inboxIssue) => inboxIssue.id === issueId)?.id!,
                            {
                              status: 1,
                            },
                            user
                          )
                          .then(() => {
                            reset(defaultValues);
                            mutate(ISSUE_DETAILS(issueId as string), undefined);
                            inboxIssuesMutate((prevData) =>
                              (prevData ?? [])?.map((item) => ({
                                ...item,
                                status: item.id === issueId ? 1 : item.issue_inbox.status,
                              }))
                            );
                          });
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          )
        ) : (
          <div className="flex justify-center items-center h-full">
            <Spinner />
          </div>
        )}
      </ProjectAuthorizationWrapper>
    </IssueViewContextProvider>
  );
};

export default ProjectIssues;
