import { useRouter } from "next/router";
import { GetServerSidePropsContext } from "next";

import useSWR from "swr";

// lib
import { requiredAdmin, requiredAuth } from "lib/auth";
// services
import projectService from "services/project.service";
import viewsService from "services/views.service";
// layouts
import AppLayout from "layouts/app-layout";
// contexts
import { IssueViewContextProvider } from "contexts/issue-view.context";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import { UserAuth } from "types";
// fetch-keys
import { PROJECT_DETAILS, VIEWS_LIST, VIEW_DETAILS } from "constants/fetch-keys";
import { IssuesFilterView, IssuesView } from "components/core";
import { CustomMenu, HeaderButton } from "components/ui";
import { PlusIcon } from "@heroicons/react/24/outline";
import { truncateText } from "helpers/string.helper";
import { StackedLayersIcon } from "components/icons";

const SingleView: React.FC<UserAuth> = (props) => {
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;

  const { data: activeProject } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: views } = useSWR(
    workspaceSlug && projectId ? VIEWS_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => viewsService.getViews(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: viewDetails } = useSWR(
    workspaceSlug && projectId && viewId ? VIEW_DETAILS(viewId as string) : null,
    workspaceSlug && projectId && viewId
      ? () =>
          viewsService.getViewDetails(
            workspaceSlug as string,
            projectId as string,
            viewId as string
          )
      : null
  );

  return (
    <IssueViewContextProvider>
      <AppLayout
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem
              title={`${activeProject?.name ?? "Project"} Views`}
              link={`/${workspaceSlug}/projects/${activeProject?.id}/cycles`}
            />
          </Breadcrumbs>
        }
        left={
          <CustomMenu
            label={
              <>
                <StackedLayersIcon height={12} width={12} />
                {viewDetails?.name && truncateText(viewDetails.name, 40)}
              </>
            }
            className="ml-1.5"
            width="auto"
          >
            {views?.map((view) => (
              <CustomMenu.MenuItem
                key={view.id}
                renderAs="a"
                href={`/${workspaceSlug}/projects/${projectId}/views/${view.id}`}
              >
                {truncateText(view.name, 40)}
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>
        }
        right={
          <div className="flex items-center gap-2">
            <IssuesFilterView />
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
        <IssuesView userAuth={props} />
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

export default SingleView;
