import { useRouter } from "next/router";

import useSWR from "swr";

// services
import { ProjectService } from "services/project";
import { ViewService } from "services/view.service";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout-legacy";
// components
import { ProjectViewLayoutRoot } from "components/issues";
// ui
import { CustomMenu } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
import { EmptyState } from "components/common";
// icons
import { StackedLayersIcon } from "components/icons";
// images
import emptyView from "public/empty-state/view.svg";
// helpers
import { truncateText } from "helpers/string.helper";
// fetch-keys
import { PROJECT_DETAILS, VIEWS_LIST, VIEW_DETAILS } from "constants/fetch-keys";
import { ProjectViewIssuesHeader } from "components/headers";

// services
const projectService = new ProjectService();
const viewService = new ViewService();

const SingleView: React.FC = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;

  const { data: activeProject } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId ? () => projectService.getProject(workspaceSlug as string, projectId as string) : null
  );

  const { data: views } = useSWR(
    workspaceSlug && projectId ? VIEWS_LIST(projectId as string) : null,
    workspaceSlug && projectId ? () => viewService.getViews(workspaceSlug as string, projectId as string) : null
  );

  const { data: viewDetails, error } = useSWR(
    workspaceSlug && projectId && viewId ? VIEW_DETAILS(viewId as string) : null,
    workspaceSlug && projectId && viewId
      ? () => viewService.getViewDetails(workspaceSlug as string, projectId as string, viewId as string)
      : null
  );

  return (
    <ProjectAuthorizationWrapper
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
      right={<ProjectViewIssuesHeader />}
    >
      {error ? (
        <EmptyState
          image={emptyView}
          title="View does not exist"
          description="The view you are looking for does not exist or has been deleted."
          primaryButton={{
            text: "View other views",
            onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/views`),
          }}
        />
      ) : (
        <ProjectViewLayoutRoot />
      )}
    </ProjectAuthorizationWrapper>
  );
};

export default SingleView;
