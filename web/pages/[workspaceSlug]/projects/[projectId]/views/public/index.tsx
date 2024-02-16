import { Fragment, ReactElement, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { useTheme } from "next-themes";
import { CheckCircle } from "lucide-react";
// hooks
import { useUser, useView } from "hooks/store";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
import { ViewHeader } from "components/view";
// ui
import { Spinner } from "@plane/ui";
// types
import { NextPageWithLayout } from "lib/types";
// constants
import { VIEW_TYPES } from "constants/view";
import { VIEW_EMPTY_STATE_DETAILS } from "constants/empty-state";

const ProjectPublicViewPage: NextPageWithLayout = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // hooks
  const viewStore = useView(workspaceSlug?.toString(), projectId?.toString(), VIEW_TYPES.PROJECT_PUBLIC_VIEWS);
  const { currentUser } = useUser();
  // theme
  const { resolvedTheme } = useTheme();

  const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";
  const EmptyStateImagePath = getEmptyStateImagePath("onboarding", "views", isLightMode);

  useSWR(
    workspaceSlug && projectId
      ? `PROJECT_VIEWS_${VIEW_TYPES.PROJECT_PUBLIC_VIEWS}_${workspaceSlug.toString()}_${projectId.toString()}`
      : null,
    async () => {
      if (workspaceSlug && projectId) {
        await viewStore?.fetch(workspaceSlug.toString(), projectId.toString());
        console.log("viewStore", viewStore?.viewIds);
      }
    }
  );

  useEffect(() => {
    if (workspaceSlug && projectId && viewStore?.viewIds && viewStore?.viewIds.length > 0) {
      router.push(`/${workspaceSlug}/projects/${projectId}/views/public/${viewStore?.viewIds[0]}`);
    }
  }, [workspaceSlug, projectId, viewStore?.viewIds, router]);

  const workspaceViewTabOptions = useMemo(
    () => [
      {
        key: VIEW_TYPES.PROJECT_PRIVATE_VIEWS,
        title: "Private",
        href: `/${workspaceSlug}/projects/${projectId}/views/private`,
      },
      {
        key: VIEW_TYPES.PROJECT_PUBLIC_VIEWS,
        title: "Public",
        href: `/${workspaceSlug}/projects/${projectId}/views/public`,
      },
    ],
    [workspaceSlug, projectId]
  );

  if (!workspaceSlug || !projectId) return <></>;
  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {viewStore?.loader === "view-loader" ? (
        <div className="relative w-full h-full flex justify-center items-center">
          <Spinner />
        </div>
      ) : (
        <>
          {viewStore?.viewIds && viewStore?.viewIds?.length <= 0 && (
            <Fragment>
              <div className="flex-shrink-0 px-5 pt-4 pb-4 border-b border-custom-border-200">
                <ViewHeader
                  projectId={projectId.toString()}
                  viewType={VIEW_TYPES.PROJECT_PUBLIC_VIEWS}
                  titleIcon={<CheckCircle size={12} />}
                  title="Views"
                  workspaceViewTabOptions={workspaceViewTabOptions}
                />
              </div>
              <div className="relative w-full h-full flex justify-center items-center overflow-hidden overflow-y-auto">
                <EmptyState
                  title={VIEW_EMPTY_STATE_DETAILS["project-views"].title}
                  description={VIEW_EMPTY_STATE_DETAILS["project-views"].description}
                  image={EmptyStateImagePath}
                  comicBox={{
                    title: VIEW_EMPTY_STATE_DETAILS["project-views"].comicBox.title,
                    description: VIEW_EMPTY_STATE_DETAILS["project-views"].comicBox.description,
                  }}
                  primaryButton={{
                    text: VIEW_EMPTY_STATE_DETAILS["project-views"].primaryButton.text,
                    onClick: () => {},
                  }}
                  size="lg"
                />
              </div>
            </Fragment>
          )}
        </>
      )}
    </div>
  );
});

ProjectPublicViewPage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<></>}>{page}</AppLayout>;
};

export default ProjectPublicViewPage;
