import { ReactElement } from "react";
import { useRouter } from "next/router";
import { X, PenSquare } from "lucide-react";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { DraftIssueLayoutRoot } from "components/issues/issue-layouts/roots/draft-issue-layout-root";
import { PageHead } from "components/core";
import { ProjectDraftIssueHeader } from "components/headers";
// types
import { NextPageWithLayout } from "lib/types";
// hooks
import { useProject } from "hooks/store";
import { observer } from "mobx-react";

const ProjectDraftIssuesPage: NextPageWithLayout = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store
  const { getProjectById } = useProject();
  // derived values
  const project = projectId ? getProjectById(projectId.toString()) : undefined;
  const pageTitle = project?.name ? `${project?.name} - Draft Issues` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full w-full flex-col">
        <div className="ga-1 flex items-center border-b border-custom-border-200 px-4 py-2.5 shadow-sm">
          <button
            type="button"
            onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}/issues/`)}
            className="flex items-center gap-1.5 rounded-full border border-custom-border-200 px-3 py-1.5 text-xs"
          >
            <PenSquare className="h-4 w-4" />
            <span>Draft Issues</span>
          </button>
          <X className="h-3 w-3" />
        </div>
        <DraftIssueLayoutRoot />
      </div>
    </>
  );
});

ProjectDraftIssuesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectDraftIssueHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectDraftIssuesPage;
