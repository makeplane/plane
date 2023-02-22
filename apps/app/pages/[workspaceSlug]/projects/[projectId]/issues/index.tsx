import { useRouter } from "next/router";

import useSWR from "swr";

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
import { IssuesFilterView, IssuesView } from "components/core";
// ui
import { Spinner, EmptySpace, EmptySpaceItem, HeaderButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { RectangleStackIcon, PlusIcon } from "@heroicons/react/24/outline";
// types
import type { UserAuth } from "types";
import type { GetServerSidePropsContext, NextPage } from "next";
// fetch-keys
import { PROJECT_DETAILS, PROJECT_ISSUES_LIST } from "constants/fetch-keys";

const ProjectIssues: NextPage<UserAuth> = (props) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

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
            <IssuesFilterView issues={projectIssues?.filter((p) => p.parent === null) ?? []} />
            <HeaderButton
              Icon={PlusIcon}
              label="Add Issue"
              onClick={() => {
                const e = new KeyboardEvent("keydown", {
                  key: "c",
                });
                document.dispatchEvent(e);
              }}
            />
          </div>
        }
      >
        {projectIssues ? (
          projectIssues.length > 0 ? (
            <IssuesView
              issues={projectIssues?.filter((p) => p.parent === null) ?? []}
              userAuth={props}
            />
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
                      Use <pre className="inline rounded bg-gray-200 px-2 py-1">C</pre> shortcut to
                      create a new issue
                    </span>
                  }
                  Icon={PlusIcon}
                  action={() => {
                    const e = new KeyboardEvent("keydown", {
                      key: "c",
                    });
                    document.dispatchEvent(e);
                  }}
                />
              </EmptySpace>
            </div>
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Spinner />
          </div>
        )}
      </AppLayout>
    </IssueViewContextProvider>
  );
};

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const user = await requiredAuth(ctx.req?.headers.cookie);

  const redirectAfterSignIn = ctx.resolvedUrl;

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
