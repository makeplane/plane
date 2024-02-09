import { ReactElement, useMemo } from "react";
import { useRouter } from "next/router";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { AllIssuesViewRoot } from "components/view";
// types
import { NextPageWithLayout } from "lib/types";
// constants
import { VIEW_TYPES } from "constants/view";

const WorkspacePublicViewPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { workspaceSlug, viewId } = router.query;

  const workspaceViewTabOptions = useMemo(
    () => [
      {
        key: VIEW_TYPES.WORKSPACE_PRIVATE_VIEWS,
        title: "Private",
        href: `/${workspaceSlug}/views/private/assigned`,
      },
      {
        key: VIEW_TYPES.WORKSPACE_PUBLIC_VIEWS,
        title: "Public",
        href: `/${workspaceSlug}/views/public/all-issues`,
      },
    ],
    [workspaceSlug]
  );

  if (!workspaceSlug || !viewId) return <></>;
  return (
    <div className="w-full h-full overflow-hidden bg-custom-background-100 relative flex flex-col">
      <div className="flex-shrink-0 w-full">
        <AllIssuesViewRoot
          workspaceSlug={workspaceSlug.toString()}
          projectId={undefined}
          viewId={viewId.toString()}
          viewType={VIEW_TYPES.WORKSPACE_PUBLIC_VIEWS}
          baseRoute={`/${workspaceSlug?.toString()}/views/public`}
          workspaceViewTabOptions={workspaceViewTabOptions}
        />
      </div>
      <div className="w-full h-full overflow-hidden">Issues render</div>
    </div>
  );
};

WorkspacePublicViewPage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<></>}>{page}</AppLayout>;
};

export default WorkspacePublicViewPage;
