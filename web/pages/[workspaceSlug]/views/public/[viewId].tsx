import { ReactElement } from "react";
import { useRouter } from "next/router";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { AllIssuesViewRoot } from "components/view";
// types
import { NextPageWithLayout } from "lib/types";
// constants
import { VIEW_TYPES } from "constants/view";

const GlobalViewIssuesPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { workspaceSlug, viewId } = router.query;

  if (!workspaceSlug || !viewId) return <></>;
  return (
    <div className="h-full overflow-hidden bg-custom-background-100">
      <div className="flex h-full w-full flex-col border-b border-custom-border-300">
        <AllIssuesViewRoot
          workspaceSlug={workspaceSlug.toString()}
          projectId={undefined}
          viewId={viewId.toString()}
          viewType={VIEW_TYPES.WORKSPACE_PUBLIC_VIEWS}
          baseRoute={`/${workspaceSlug?.toString()}/views/public`}
        />
      </div>
    </div>
  );
};

GlobalViewIssuesPage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<></>}>{page}</AppLayout>;
};

export default GlobalViewIssuesPage;
