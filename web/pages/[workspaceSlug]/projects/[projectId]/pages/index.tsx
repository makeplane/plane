import { ReactElement, useState } from "react";
import { useRouter } from "next/router";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { PagesHeader } from "components/headers";
import { PageView, PagesListRoot, CreateUpdatePageModal } from "components/pages";
// types
import { NextPageWithLayout } from "lib/types";
import { TPageNavigationTabs } from "@plane/types";
// constants

const ProjectPagesPage: NextPageWithLayout = () => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, type } = router.query;
  // state
  const [modalOpen, setModalOpen] = useState(false);

  const currentPageType = (): TPageNavigationTabs => {
    if (!type) return "public";
    const pageType = type.toString();
    if (pageType === "private") return "private";
    if (pageType === "archived") return "archived";
    return "public";
  };

  if (!workspaceSlug || !projectId) return <></>;
  return (
    <>
      <PageView workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} pageType={currentPageType()}>
        <PagesListRoot workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
      </PageView>

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
