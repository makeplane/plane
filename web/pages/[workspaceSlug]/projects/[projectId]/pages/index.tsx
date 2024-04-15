import { ReactElement } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// types
import { TPageNavigationTabs } from "@plane/types";
// components
import { PagesHeader } from "@/components/headers";
import { PagesListRoot, PagesListView } from "@/components/pages";
// hooks
import { useApplication } from "@/hooks/store";
// layouts
import { AppLayout } from "@/layouts/app-layout";
// lib
import { NextPageWithLayout } from "@/lib/types";

const ProjectPagesPage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  const { type } = router.query;
  // store hooks
  const {
    router: { workspaceSlug, projectId },
  } = useApplication();

  const currentPageType = (): TPageNavigationTabs => {
    const pageType = type?.toString();
    if (pageType === "private") return "private";
    if (pageType === "archived") return "archived";
    return "public";
  };

  if (!workspaceSlug || !projectId) return <></>;
  return (
    <PagesListView
      workspaceSlug={workspaceSlug.toString()}
      projectId={projectId.toString()}
      pageType={currentPageType()}
    >
      <PagesListRoot
        pageType={currentPageType()}
        workspaceSlug={workspaceSlug.toString()}
        projectId={projectId.toString()}
      />
    </PagesListView>
  );
});

ProjectPagesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<PagesHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectPagesPage;
