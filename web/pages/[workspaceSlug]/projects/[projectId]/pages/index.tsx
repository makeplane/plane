import { ReactElement } from "react";
import { useRouter } from "next/router";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { PagesHeader } from "components/headers";
import { PageLayout } from "components/pages";
// types
import { NextPageWithLayout } from "lib/types";
// constants

const ProjectPagesPage: NextPageWithLayout = () => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, pageType } = router.query;

  if (!workspaceSlug || !projectId) return <></>;
  return (
    <>
      <PageLayout
        workspaceSlug={workspaceSlug.toString()}
        projectId={projectId.toString()}
        pageType={pageType ? (pageType === "private" ? "private" : "public") : "public"}
      >
        <div>Pages Init</div>
      </PageLayout>
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
