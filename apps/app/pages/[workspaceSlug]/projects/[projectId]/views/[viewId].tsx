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
// components
import { CreateUpdateViewModal, DeleteViewModal } from "components/views";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import { UserAuth } from "types";
// fetch-keys
import { PROJECT_DETAILS, VIEW_DETAILS, VIEW_ISSUES } from "constants/fetch-keys";

const SingleView: React.FC<UserAuth> = (props) => {
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;

  const { data: activeProject } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
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

  const { data: viewIssues } = useSWR(
    workspaceSlug && projectId && viewId ? VIEW_ISSUES(viewId as string) : null,
    workspaceSlug && projectId && viewId
      ? () =>
          viewsService.getViewIssues(workspaceSlug as string, projectId as string, viewId as string)
      : null
  );

  return (
    <AppLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${activeProject?.name ?? "Project"} Views`}
            link={`/${workspaceSlug}/projects/${activeProject?.id}/cycles`}
          />
        </Breadcrumbs>
      }
    >
      Content here
    </AppLayout>
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
