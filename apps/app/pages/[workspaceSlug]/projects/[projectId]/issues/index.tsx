import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";
import type { NextPage, NextPageContext } from "next";

import useSWR, { mutate } from "swr";
// lib
import { requiredAuth } from "lib/auth";
// services
import issuesServices from "lib/services/issues.service";
import projectService from "lib/services/project.service";
// layouts
import AppLayout from "layouts/app-layout";
// hooks
import useIssuesFilter from "lib/hooks/useIssuesFilter";
// components
import ListView from "components/project/issues/list-view";
import BoardView from "components/project/issues/BoardView";
import ConfirmIssueDeletion from "components/project/issues/confirm-issue-deletion";
import CreateUpdateIssuesModal from "components/project/issues/create-update-issue-modal";
import View from "components/core/view";
// ui
import { Spinner, BreadcrumbItem, Breadcrumbs, EmptySpace, EmptySpaceItem, HeaderButton } from "ui";
// icons
import { ListBulletIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import { PlusIcon, Squares2X2Icon } from "@heroicons/react/20/solid";
// types
import type { IIssue, IssueResponse } from "types";
// fetch-keys
import { PROJECT_DETAILS, PROJECT_ISSUES_LIST } from "constants/fetch-keys";

const ProjectIssues: NextPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<
    (IIssue & { actionType: "edit" | "delete" }) | undefined
  >(undefined);
  const [deleteIssue, setDeleteIssue] = useState<string | undefined>(undefined);

  const {
    query: { workspaceSlug, projectId },
  } = useRouter();

  const { data: projectIssues } = useSWR(
    workspaceSlug && projectId
      ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string)
      : null,
    workspaceSlug && projectId
      ? () => issuesServices.getIssues(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const {
    issueView,
    groupByProperty,
    setGroupByProperty,
    groupedByIssues,
    setOrderBy,
    setFilterIssue,
    orderBy,
    filterIssue,
    resetFilterToDefault,
    setNewFilterDefaultView,
    setIssueViewToKanban,
    setIssueViewToList,
  } = useIssuesFilter(projectIssues?.results.filter((p) => p.parent === null) ?? []);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSelectedIssue(undefined);
        clearTimeout(timer);
      }, 500);
    }
  }, [isOpen]);

  const partialUpdateIssue = (formData: Partial<IIssue>, issueId: string) => {
    if (!workspaceSlug || !projectId) return;
    issuesServices
      .patchIssue(workspaceSlug as string, projectId as string, issueId, formData)
      .then((response) => {
        mutate<IssueResponse>(
          PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string),
          (prevData) => ({
            ...(prevData as IssueResponse),
            results:
              prevData?.results.map((issue) => (issue.id === response.id ? response : issue)) ?? [],
          }),
          false
        );
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <AppLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
          <BreadcrumbItem title={`${projectDetails?.name ?? "Project"} Issues`} />
        </Breadcrumbs>
      }
      right={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-x-1">
            <button
              type="button"
              className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-200 ${
                issueView === "list" ? "bg-gray-200" : ""
              }`}
              onClick={() => setIssueViewToList()}
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-200 ${
                issueView === "kanban" ? "bg-gray-200" : ""
              }`}
              onClick={() => setIssueViewToKanban()}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
          </div>
          <View
            groupByProperty={groupByProperty}
            setGroupByProperty={setGroupByProperty}
            orderBy={orderBy}
            setOrderBy={setOrderBy}
            filterIssue={filterIssue}
            setFilterIssue={setFilterIssue}
            resetFilterToDefault={resetFilterToDefault}
            setNewFilterDefaultView={setNewFilterDefaultView}
          />
          <HeaderButton
            Icon={PlusIcon}
            label="Add Issue"
            onClick={() => {
              const e = new KeyboardEvent("keydown", {
                key: "i",
                ctrlKey: true,
              });
              document.dispatchEvent(e);
            }}
          />
        </div>
      }
    >
      <CreateUpdateIssuesModal
        isOpen={isOpen && selectedIssue?.actionType !== "delete"}
        setIsOpen={setIsOpen}
        projectId={projectId as string}
        data={selectedIssue}
      />
      <ConfirmIssueDeletion
        handleClose={() => setDeleteIssue(undefined)}
        isOpen={!!deleteIssue}
        data={projectIssues?.results.find((issue) => issue.id === deleteIssue)}
      />
      {!projectIssues ? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      ) : projectIssues.count > 0 ? (
        <>
          {issueView === "list" ? (
            <ListView
              groupedByIssues={groupedByIssues}
              selectedGroup={groupByProperty}
              setSelectedIssue={setSelectedIssue}
              handleDeleteIssue={setDeleteIssue}
              partialUpdateIssue={partialUpdateIssue}
            />
          ) : (
            <div className="h-screen">
              <BoardView
                selectedGroup={groupByProperty}
                groupedByIssues={groupedByIssues}
                handleDeleteIssue={setDeleteIssue}
                partialUpdateIssue={partialUpdateIssue}
              />
            </div>
          )}
        </>
      ) : (
        <div className="grid h-full w-full place-items-center px-4 sm:px-0">
          <EmptySpace
            title="You don't have any issue yet."
            description="Issues help you track individual pieces of work. With Issues, keep track of what's going on, who is working on it, and what's done."
            Icon={RectangleStackIcon}
          >
            <EmptySpaceItem
              title="Create a new issue"
              description={
                <span>
                  Use <pre className="inline rounded bg-gray-100 px-2 py-1">Ctrl/Command + I</pre>{" "}
                  shortcut to create a new issue
                </span>
              }
              Icon={PlusIcon}
              action={() => setIsOpen(true)}
            />
          </EmptySpace>
        </div>
      )}
    </AppLayout>
  );
};

export const getServerSideProps = async (ctx: NextPageContext) => {
  const user = await requiredAuth(ctx.req?.headers.cookie);

  const redirectAfterSignIn = ctx.req?.url;

  if (!user) {
    return {
      redirect: {
        destination: `/signin?next=${redirectAfterSignIn}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      user,
    },
  };
};

export default ProjectIssues;
