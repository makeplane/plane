import { ReactElement } from "react";
import { useRouter } from "next/router";
// layouts
import { AppLayout } from "layouts/app-layout";
// types
import { NextPageWithLayout } from "lib/types";

const ProjectPrivateViewPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;

  if (!workspaceSlug || !projectId || !viewId) return <></>;
  return <div />;
};

ProjectPrivateViewPage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<></>}>{page}</AppLayout>;
};

export default ProjectPrivateViewPage;
