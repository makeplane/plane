import { ReactElement, useMemo } from "react";
import { useRouter } from "next/router";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { GlobalViewRoot } from "components/view";
// types
import { NextPageWithLayout } from "lib/types";
// constants
import { EViewPageType, VIEW_TYPES } from "constants/view";

const ProjectPrivateViewPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;

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

  if (!workspaceSlug || !projectId || !viewId) return <></>;
  return (
    <div className="h-full overflow-hidden bg-custom-background-100">
      <div className="flex h-full w-full flex-col border-b border-custom-border-300">
        <GlobalViewRoot
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          viewId={viewId.toString()}
          viewType={VIEW_TYPES.PROJECT_PRIVATE_VIEWS}
          viewPageType={EViewPageType.PROJECT}
          baseRoute={`/${workspaceSlug?.toString()}/projects/${projectId}/views/private`}
        />
      </div>
    </div>
  );
};

ProjectPrivateViewPage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<></>}>{page}</AppLayout>;
};

export default ProjectPrivateViewPage;
