import { ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react";
// hooks
import { useInbox, useProject } from "hooks/store";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { ProjectInboxHeader } from "components/headers";
// types
import { NextPageWithLayout } from "lib/types";

const ProjectInboxPage: NextPageWithLayout = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { currentProjectDetails } = useProject();
  const { fetchInboxes } = useInbox();

  useSWR(
    workspaceSlug && projectId && currentProjectDetails && currentProjectDetails?.inbox_view
      ? `INBOX_${workspaceSlug.toString()}_${projectId.toString()}`
      : null,
    async () => {
      if (workspaceSlug && projectId && currentProjectDetails && currentProjectDetails?.inbox_view) {
        const inboxes = await fetchInboxes(workspaceSlug.toString(), projectId.toString());
        if (inboxes && inboxes.length > 0)
          router.push(`/${workspaceSlug}/projects/${projectId}/inbox/${inboxes[0].id}`);
      }
    }
  );

  return (
    <div className="flex h-full flex-col">
      {currentProjectDetails?.inbox_view ? <div>Loading...</div> : <div>You don{"'"}t have access to inbox</div>}
    </div>
  );
});

ProjectInboxPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectInboxHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectInboxPage;
