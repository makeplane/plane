import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import { RectangleStackIcon } from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/20/solid";
// lib
import { requiredAdmin, requiredAuth } from "lib/auth";
// services
import issuesServices from "services/issues.service";
import projectService from "services/project.service";
// layouts
import AppLayout from "layouts/app-layout";
// contexts
import { IssueViewContextProvider } from "contexts/issue-view.context";
// components
import ListView from "components/project/issues/list-view";
import BoardView from "components/project/issues/BoardView";
import ConfirmIssueDeletion from "components/project/issues/confirm-issue-deletion";
import { CreateUpdateIssueModal } from "components/issues";
import View from "components/core/view";
// ui
import { Spinner, EmptySpace, EmptySpaceItem, HeaderButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import type { IIssue, IssueResponse, UserAuth } from "types";
import type { NextPage, NextPageContext } from "next";
// fetch-keys
import { PROJECT_DETAILS, PROJECT_ISSUES_LIST } from "constants/fetch-keys";

const ProjectIssues: NextPage<UserAuth> = (props) => {
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

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSelectedIssue(undefined);
        clearTimeout(timer);
      }, 500);
    }
  }, [isOpen]);

  const handleEditIssue = (issue: IIssue) => {
    setIsOpen(true);
    setSelectedIssue({ ...issue, actionType: "edit" });
  };

  return (
    <IssueViewContextProvider>
      <AppLayout
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
            <BreadcrumbItem title={`${projectDetails?.name ?? "Project"} Issues`} />
          </Breadcrumbs>
        }
        right={
          <div className="flex items-center gap-2">
            <View issues={projectIssues?.results.filter((p) => p.parent === null) ?? []} />
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
        <CreateUpdateIssueModal
          isOpen={isOpen && selectedIssue?.actionType !== "delete"}
          prePopulateData={{ ...selectedIssue }}
          handleClose={() => setIsOpen(false)}
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
            <ListView
              issues={projectIssues?.results.filter((p) => p.parent === null) ?? []}
              handleEditIssue={handleEditIssue}
              userAuth={props}
            />
            <BoardView
              issues={projectIssues?.results.filter((p) => p.parent === null) ?? []}
              handleDeleteIssue={setDeleteIssue}
              userAuth={props}
            />
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
                    Use <pre className="inline rounded bg-gray-100 px-2 py-1">C</pre> shortcut to
                    create a new issue
                  </span>
                }
                Icon={PlusIcon}
                action={() => setIsOpen(true)}
              />
            </EmptySpace>
          </div>
        )}
      </AppLayout>
    </IssueViewContextProvider>
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

  const projectId = ctx.query.projectId as string;
  const workspaceSlug = ctx.query.workspaceSlug as string;

  const memberDetail = await requiredAdmin(workspaceSlug, projectId, ctx.req?.headers.cookie);

  return {
    props: {
      isOwner: memberDetail?.role === 20,
      isMember: memberDetail?.role === 15,
      isViewer: memberDetail?.role === 10,
      isGuest: memberDetail?.role === 5,
    },
  };
};

export default ProjectIssues;
