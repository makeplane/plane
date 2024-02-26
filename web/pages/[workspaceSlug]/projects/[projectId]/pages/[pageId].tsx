import { Fragment, ReactElement } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { PageDetailsHeader } from "components/headers/page-details";
import { PageDetailRoot } from "components/pages";
// types
import { NextPageWithLayout } from "lib/types";

const PageDetailsPage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, pageId } = router.query;

  if (!workspaceSlug || !projectId || !pageId) return <></>;
  return (
    <Fragment>
      <PageDetailRoot projectId={projectId.toString()} pageId={pageId.toString()} />
    </Fragment>
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
