import { ReactElement } from "react";
import { useRouter } from "next/router";
import { X, PenSquare } from "lucide-react";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { DraftIssueLayoutRoot } from "components/issues/issue-layouts/roots/draft-issue-layout-root";
import { ProjectDraftIssueHeader } from "components/headers";
// types
import { NextPageWithLayout } from "lib/types";

const ProjectDraftIssuesPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  return (
    <div className="flex h-full w-full flex-col">
      <div className="ga-1 flex items-center border-b border-custom-border-200 px-4 py-2.5 shadow-sm">
        <button
          type="button"
          onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}/issues/`)}
          className="flex items-center gap-1.5 rounded-full border border-custom-border-200 px-3 py-1.5 text-xs"
        >
          <PenSquare className="h-4 w-4" />
          <span>Draft Issues</span>
          <X className="h-3 w-3" />
        </button>
      </div>
      <DraftIssueLayoutRoot />
    </div>
  );
};

ProjectDraftIssuesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectDraftIssueHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ProjectDraftIssuesPage;
