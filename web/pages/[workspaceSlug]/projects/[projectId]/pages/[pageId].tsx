import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { useRouter } from "next/router";
import { ReactElement, useEffect, useRef, useState } from "react";
//components
import { PageHead } from "components/core";
// hooks
import { useApplication, usePage, useUser, useWorkspace } from "hooks/store";

// layouts
import { AppLayout } from "layouts/app-layout";
import { PageDetailsHeader } from "components/headers/page-details";
import { Spinner } from "@plane/ui";
// assets
// helpers
// types
import { NextPageWithLayout } from "lib/types";
// fetch-keys
import { useProjectPages } from "hooks/store/use-project-specific-pages";

const PageDetailsPage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, pageId } = router.query;
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const workspaceId = getWorkspaceBySlug(workspaceSlug as string)?.id as string;
  const {
    config: { envConfig },
  } = useApplication();
  const {
    archivePage: archivePageAction,
    restorePage: restorePageAction,
    createPage: createPageAction,
    projectPageMap,
    projectArchivedPageMap,
    getPageDetails,
    fetchProjectPages,
    fetchArchivedProjectPages,
  } = useProjectPages();
  const pageStore = pageId ? usePage(pageId.toString()) : undefined;
  // derived values
  const pageTitle = pageStore?.name;
  const hasPageInStore = projectId && pageId ? getPageDetails(projectId.toString(), pageId.toString()) : undefined;

  // We need to get the values of title and description from the page store but we don't have to subscribe to those values
  return pageIdMobx ? (
    <>
      <PageHead title={pageTitle} />
      <PageDetailsView workspaceSlug={workspaceSlug} projectId={projectId} pageId={pageId} />
    </>
  ) : (
    <div className="grid h-full w-full place-items-center">
      <Spinner />
    </div>
  );
});

PageDetailsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<PageDetailsHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default PageDetailsPage;
