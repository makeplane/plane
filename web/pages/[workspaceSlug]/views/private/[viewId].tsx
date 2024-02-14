import { ReactElement, useMemo } from "react";
import { useRouter } from "next/router";
import { CheckCircle } from "lucide-react";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { GlobalViewRoot, ViewHeader } from "components/view";
// types
import { NextPageWithLayout } from "lib/types";
// constants
import { EViewPageType, VIEW_TYPES } from "constants/view";

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
    <div className="w-full h-full overflow-hidden bg-custom-background-100 relative flex flex-col">
      <div className="flex-shrink-0 w-full">
        {/* header */}
        <div className="px-5 pt-4 pb-2 border-b border-custom-border-200">
          <ViewHeader
            projectId={undefined}
            viewType={VIEW_TYPES.WORKSPACE_PRIVATE_VIEWS}
            titleIcon={<CheckCircle size={12} />}
            title="All Issues"
            workspaceViewTabOptions={workspaceViewTabOptions}
          />
        </div>

        {/* content */}
        <GlobalViewRoot
          workspaceSlug={workspaceSlug.toString()}
          projectId={undefined}
          viewId={viewId.toString()}
          viewType={VIEW_TYPES.WORKSPACE_PRIVATE_VIEWS}
          viewPageType={EViewPageType.ALL}
          baseRoute={`/${workspaceSlug?.toString()}/views/private`}
        />
      </div>

      <div className="w-full h-full overflow-hidden relative flex justify-center items-center text-sm text-custom-text-300">
        Issues render placeholder
      </div>
    </div>
  );
};

WorkspacePrivateViewPage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<></>}>{page}</AppLayout>;
};

export default WorkspacePrivateViewPage;
