import { ReactElement, useState } from "react";
import { useRouter } from "next/router";
// types
import { TPageNavigationTabs } from "@plane/types";
// components
import { PagesHeader } from "@/components/headers";
import { PagesListRoot, PagesListView, CreateUpdatePageModal } from "@/components/pages";
// layouts
import { AppLayout } from "@/layouts/app-layout";
// lib
import { NextPageWithLayout } from "@/lib/types";

const ProjectPagesPage: NextPageWithLayout = () => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, type } = router.query;
  // state
  const [modalOpen, setModalOpen] = useState(false);

  const currentPageType = (): TPageNavigationTabs => {
    const pageType = type?.toString();
    if (pageType === "private") return "private";
    if (pageType === "archived") return "archived";
    return "public";
  };

  if (!workspaceSlug || !projectId) return <></>;
  return (
    <>
      <PagesListView
        workspaceSlug={workspaceSlug.toString()}
        projectId={projectId.toString()}
        pageType={currentPageType()}
      >
        <PagesListRoot workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
      </PagesListView>

      <CreateUpdatePageModal
        workspaceSlug={workspaceSlug.toString()}
        projectId={projectId.toString()}
        isModalOpen={modalOpen}
        handleModalClose={() => setModalOpen(false)}
        redirectionEnabled
      />
    </>
  );
};

ProjectPagesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<PagesHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectPagesPage;
