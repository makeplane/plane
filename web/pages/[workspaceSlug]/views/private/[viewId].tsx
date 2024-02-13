import { ReactElement, useMemo } from "react";
import { useRouter } from "next/router";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { GlobalViewRoot } from "components/view";
// types
import { NextPageWithLayout } from "lib/types";
// constants
import { VIEW_TYPES } from "constants/view";

const WorkspacePrivateViewPage: NextPageWithLayout = () => {
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
    <div className="h-full overflow-hidden bg-custom-background-100">
      <div className="flex h-full w-full flex-col border-b border-custom-border-300">
        <GlobalViewRoot
          workspaceSlug={workspaceSlug.toString()}
          projectId={undefined}
          viewId={viewId.toString()}
          viewType={VIEW_TYPES.WORKSPACE_PRIVATE_VIEWS}
          baseRoute={`/${workspaceSlug?.toString()}/views/private`}
          workspaceViewTabOptions={workspaceViewTabOptions}
        />
      </div>
    </div>
  );
};

WorkspacePrivateViewPage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<></>}>{page}</AppLayout>;
};

export default WorkspacePrivateViewPage;
